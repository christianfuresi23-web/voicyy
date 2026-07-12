export type JourneyPoint = {
  x: number;
  y: number;
};

export function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function smoothStep(value: number) {
  const clamped = clampUnit(value);
  return clamped * clamped * (3 - 2 * clamped);
}

export function sampleCurvedSegment(
  from: JourneyPoint,
  to: JourneyPoint,
  progress: number,
  bend: number,
): JourneyPoint {
  const clampedProgress = clampUnit(progress);
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.max(1, Math.hypot(deltaX, deltaY));
  const perpendicularX = -deltaY / length;
  const perpendicularY = deltaX / length;

  const controlOne = {
    x: mix(from.x, to.x, 0.3) + perpendicularX * bend,
    y: mix(from.y, to.y, 0.3) + perpendicularY * bend,
  };
  const controlTwo = {
    x: mix(from.x, to.x, 0.7) + perpendicularX * bend,
    y: mix(from.y, to.y, 0.7) + perpendicularY * bend,
  };

  const inverse = 1 - clampedProgress;
  const inverseSquared = inverse * inverse;
  const progressSquared = clampedProgress * clampedProgress;

  return {
    x:
      inverseSquared * inverse * from.x +
      3 * inverseSquared * clampedProgress * controlOne.x +
      3 * inverse * progressSquared * controlTwo.x +
      progressSquared * clampedProgress * to.x,
    y:
      inverseSquared * inverse * from.y +
      3 * inverseSquared * clampedProgress * controlOne.y +
      3 * inverse * progressSquared * controlTwo.y +
      progressSquared * clampedProgress * to.y,
  };
}
