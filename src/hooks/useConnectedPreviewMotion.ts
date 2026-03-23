import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { clamp, normalizeAngle, rotatePoint, type PreviewPhysicsModel } from "../simulator";

type Options = {
  anchorTop: number;
  artworkSize: number;
  connectedEnabled: boolean;
  disabled: boolean;
  enabled: boolean;
  lowerEquilibrium: number;
  physicsModel: PreviewPhysicsModel;
  previewAngleLimit: number;
  previewDragVelocityLimit: number;
};

export function useConnectedPreviewMotion({
  anchorTop,
  artworkSize,
  connectedEnabled,
  disabled,
  enabled,
  lowerEquilibrium,
  physicsModel,
  previewAngleLimit,
  previewDragVelocityLimit,
}: Options) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [subSwingAngle, setSubSwingAngle] = useState(0);
  const [subTiltAngle, setSubTiltAngle] = useState(0);
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
  const subMotionRef = useRef({
    swingAngle: 0,
    swingVelocity: 0,
    tiltAngle: 0,
    tiltVelocity: 0,
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
      subMotionRef.current = {
        swingAngle: 0,
        swingVelocity: 0,
        tiltAngle: 0,
        tiltVelocity: 0,
      };
      setAngle(0);
      setSubSwingAngle(0);
      setSubTiltAngle(0);
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
      const subMotion = subMotionRef.current;

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
        if (connectedEnabled && !motion.isDragging) {
          motion.angularVelocity *= 0.996;
        }
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

      if (connectedEnabled) {
        const swingError = normalizeAngle(lowerEquilibrium - subMotion.swingAngle);
        const angleCoupling = normalizeAngle(motion.angle - subMotion.swingAngle);
        const connectorDrive =
          swingError * 9.8 + angleCoupling * 5.4 + motion.angularVelocity * 0.28 - subMotion.swingVelocity * 7.1;

        subMotion.swingVelocity += connectorDrive * elapsed;
        subMotion.swingAngle = clamp(normalizeAngle(subMotion.swingAngle + subMotion.swingVelocity * elapsed), -1.16, 1.16);

        const tiltTarget = clamp(angleCoupling * 0.16 + subMotion.swingVelocity * 0.04, -0.28, 0.28);
        subMotion.tiltVelocity += (tiltTarget - subMotion.tiltAngle) * 13 * elapsed;
        subMotion.tiltVelocity *= 0.92;
        subMotion.tiltAngle = normalizeAngle(subMotion.tiltAngle + subMotion.tiltVelocity * elapsed);
      } else {
        subMotion.swingAngle = 0;
        subMotion.swingVelocity = 0;
        subMotion.tiltAngle = 0;
        subMotion.tiltVelocity = 0;
      }

      setAngle(motion.angle);
      setSubSwingAngle(subMotion.swingAngle);
      setSubTiltAngle(subMotion.tiltAngle);
      motion.lastTimestamp = timestamp;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [connectedEnabled, enabled, lowerEquilibrium, physicsModel, previewAngleLimit]);

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

  const beginPreviewDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  const movePreviewDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    subSwingAngle,
    subTiltAngle,
  };
}
