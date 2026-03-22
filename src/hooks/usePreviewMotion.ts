import { useEffect, useRef, useState } from "react";

import { clamp, normalizeAngle, rotatePoint, type PreviewPhysicsModel } from "../simulator";

type Options = {
  anchorTop: number;
  artworkSize: number;
  disabled: boolean;
  enabled: boolean;
  physicsModel: PreviewPhysicsModel;
  previewAngleLimit: number;
  previewDragVelocityLimit: number;
};

export function usePreviewMotion({
  anchorTop,
  artworkSize,
  disabled,
  enabled,
  physicsModel,
  previewAngleLimit,
  previewDragVelocityLimit,
}: Options) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState(0);
  const motionRef = useRef({
    angle: 0,
    angularVelocity: 0,
    desiredAngle: 0,
    lastDragAngle: 0,
    lastDragTimestamp: 0,
    isDragging: false,
    lastTimestamp: null as number | null,
    pointerId: null as number | null,
  });

  useEffect(() => {
    if (!enabled) {
      motionRef.current = {
        angle: 0,
        angularVelocity: 0,
        desiredAngle: 0,
        lastDragAngle: 0,
        lastDragTimestamp: 0,
        isDragging: false,
        lastTimestamp: null,
        pointerId: null,
      };
      setAngle(0);
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const motion = motionRef.current;
    motion.lastTimestamp = null;

    const tick = (timestamp: number) => {
      const elapsed =
        motion.lastTimestamp === null
          ? 1 / 60
          : clamp((timestamp - motion.lastTimestamp) / 1000, 1 / 240, 1 / 24);
      const fixedStep = 1 / 120;
      const subSteps = Math.max(1, Math.ceil(elapsed / fixedStep));
      const stepDt = elapsed / subSteps;

      for (let step = 0; step < subSteps; step += 1) {
        const profile = physicsModel.profile;
        const pivotToComOffset = rotatePoint(physicsModel.pivotToComLocalX, physicsModel.pivotToComLocalY, motion.angle);
        let torque = pivotToComOffset.x * -9.81 * profile.totalMass * profile.combinedComTorqueScale;
        const targetAngle = motion.isDragging ? motion.desiredAngle : physicsModel.equilibriumAngle;
        const angleError = normalizeAngle(targetAngle - motion.angle);
        const followStiffness = motion.isDragging ? profile.dragFollowStiffness : profile.alignStiffness;
        const followDamping = motion.isDragging ? profile.dragDamping : profile.alignDamping;
        torque += angleError * followStiffness - motion.angularVelocity * followDamping;

        motion.angularVelocity += (torque / physicsModel.inertia) * stepDt;
        motion.angularVelocity = clamp(motion.angularVelocity, -profile.maxAngularSpeed, profile.maxAngularSpeed);
        motion.angularVelocity *= profile.angularDamping;
        motion.angle = normalizeAngle(motion.angle + motion.angularVelocity * stepDt);

        const relativeTilt = normalizeAngle(motion.angle - physicsModel.equilibriumAngle);
        if (relativeTilt > previewAngleLimit) {
          motion.angle = physicsModel.equilibriumAngle + previewAngleLimit;
          motion.angularVelocity = Math.min(motion.angularVelocity, 0);
        } else if (relativeTilt < -previewAngleLimit) {
          motion.angle = physicsModel.equilibriumAngle - previewAngleLimit;
          motion.angularVelocity = Math.max(motion.angularVelocity, 0);
        }
      }

      setAngle(motion.angle);
      motion.lastTimestamp = timestamp;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [enabled, physicsModel, previewAngleLimit]);

  useEffect(() => {
    if (!enabled || disabled) return;
    const motion = motionRef.current;
    if (motion.isDragging) return;

    motion.angle = physicsModel.equilibriumAngle;
    motion.angularVelocity = 0;
    motion.desiredAngle = physicsModel.equilibriumAngle;
    motion.lastTimestamp = null;
    setAngle(physicsModel.equilibriumAngle);
  }, [disabled, enabled, physicsModel.equilibriumAngle]);

  const getPreviewAnchor = () => {
    const stage = previewRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + anchorTop,
    };
  };

  const getPointerWorldPosition = (clientX: number, clientY: number) => {
    const anchor = getPreviewAnchor();
    if (!anchor) return null;
    return {
      x: (clientX - anchor.x) / Math.max(artworkSize, 1),
      y: (anchor.y - clientY) / Math.max(artworkSize, 1),
    };
  };

  const getDragTargetAngle = (pointerWorldX: number) =>
    clamp(Math.atan(pointerWorldX * 1.7) * 0.98, -previewAngleLimit, previewAngleLimit);

  const beginPreviewDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || disabled || !previewRef.current) return;
    event.preventDefault();
    const motion = motionRef.current;
    const pointerWorld = getPointerWorldPosition(event.clientX, event.clientY);
    if (!pointerWorld) return;

    previewRef.current.setPointerCapture(event.pointerId);
    motion.isDragging = true;
    motion.pointerId = event.pointerId;
    motion.lastDragAngle = getDragTargetAngle(pointerWorld.x);
    motion.lastDragTimestamp = performance.now();
    motion.desiredAngle = motion.lastDragAngle;
    motion.lastTimestamp = motion.lastDragTimestamp;
  };

  const movePreviewDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;
    if (!motion.isDragging || motion.pointerId !== event.pointerId) return;
    const nextTarget = getPointerWorldPosition(event.clientX, event.clientY);
    if (!nextTarget) return;
    const nextAngle = getDragTargetAngle(nextTarget.x);
    const now = performance.now();
    const dt = Math.max(now - motion.lastDragTimestamp, 8) / 1000;
    const angleDelta = normalizeAngle(nextAngle - motion.lastDragAngle);
    motion.angularVelocity += clamp((angleDelta / dt) * 0.14, -previewDragVelocityLimit, previewDragVelocityLimit);
    motion.lastDragAngle = nextAngle;
    motion.lastDragTimestamp = now;
    motion.desiredAngle = nextAngle;
  };

  const endPreviewDrag = (pointerId?: number) => {
    const motion = motionRef.current;
    if (pointerId !== undefined && motion.pointerId !== pointerId) return;
    if (previewRef.current && pointerId !== undefined) {
      try {
        previewRef.current.releasePointerCapture(pointerId);
      } catch {
        // Ignore when capture is already released.
      }
    }
    motion.isDragging = false;
    motion.pointerId = null;
    motion.angularVelocity = clamp(motion.angularVelocity * 1.25, -4.8, 4.8);
    motion.lastTimestamp = performance.now();
    motion.lastDragTimestamp = 0;
    motion.desiredAngle = physicsModel.equilibriumAngle;
  };

  return {
    angle,
    beginPreviewDrag,
    endPreviewDrag,
    movePreviewDrag,
    previewRef,
  };
}
