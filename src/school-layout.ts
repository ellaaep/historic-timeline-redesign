interface LayoutGroup {
  selector: string;
  laneIndex: number;
  minWidth: number;
  rowHeight: number;
}

const GROUPS: LayoutGroup[] = [
  { selector: ".timeline-card.kind-author", laneIndex: 0, minWidth: 172, rowHeight: 37 },
  { selector: ".timeline-card.kind-work", laneIndex: 1, minWidth: 138, rowHeight: 35 },
  { selector: ".timeline-card.lane-rulers", laneIndex: 2, minWidth: 168, rowHeight: 37 },
  { selector: ".timeline-card.lane-figures", laneIndex: 7, minWidth: 168, rowHeight: 37 },
];

function numberStyle(element: HTMLElement, property: "left" | "top" | "width" | "height") {
  const inline = Number.parseFloat(element.style[property] || "");
  if (Number.isFinite(inline)) return inline;
  return Number.parseFloat(getComputedStyle(element)[property]) || 0;
}

function updateLinks(canvas: HTMLElement) {
  const focusedAuthor = canvas.querySelector<HTMLElement>(".timeline-card.kind-author.is-focused");
  const focusedWorks = [...canvas.querySelectorAll<HTMLElement>(".timeline-card.kind-work.is-focused")];
  const paths = [...canvas.querySelectorAll<SVGPathElement>(".relation-layer path")];
  if (!focusedAuthor || !focusedWorks.length || !paths.length) return;

  const canvasRect = canvas.getBoundingClientRect();
  const authorRect = focusedAuthor.getBoundingClientRect();
  focusedWorks.forEach((work, index) => {
    const path = paths[index];
    if (!path) return;
    const workRect = work.getBoundingClientRect();
    const x1 = authorRect.left - canvasRect.left + authorRect.width / 2;
    const y1 = authorRect.bottom - canvasRect.top;
    const x2 = workRect.left - canvasRect.left + workRect.width / 2;
    const y2 = workRect.top - canvasRect.top;
    const bend = y1 + (y2 - y1) * 0.52;
    path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${bend}, ${x2} ${bend}, ${x2} ${y2}`);
  });
}

function arrangeCards() {
  const canvas = document.querySelector<HTMLElement>(".timeline-canvas");
  if (!canvas) return;
  const lanes = [...canvas.querySelectorAll<HTMLElement>(".timeline-lane")];
  const availableWidth = canvas.clientWidth;
  const responsiveScale = availableWidth < 1050 ? 0.82 : availableWidth < 1350 ? 0.92 : 1;

  GROUPS.forEach((group) => {
    const lane = lanes[group.laneIndex];
    if (!lane) return;
    const laneTop = numberStyle(lane, "top");
    const laneHeight = numberStyle(lane, "height");
    const width = Math.round(group.minWidth * responsiveScale);
    const rowCount = Math.max(1, Math.floor((laneHeight - 42) / group.rowHeight));
    const rowEnds = Array.from({ length: rowCount }, () => -Infinity);
    const cards = [...canvas.querySelectorAll<HTMLElement>(group.selector)]
      .filter((card) => getComputedStyle(card).display !== "none")
      .sort((first, second) => numberStyle(first, "left") - numberStyle(second, "left"));

    cards.forEach((card) => {
      const originalWidth = numberStyle(card, "width");
      const nextWidth = Math.max(width, originalWidth);
      const unclampedLeft = numberStyle(card, "left");
      const left = Math.max(112, Math.min(availableWidth - nextWidth - 18, unclampedLeft));
      let row = rowEnds.findIndex((right) => left > right + 8);
      if (row < 0) {
        row = rowEnds.reduce(
          (best, value, index) => (value < rowEnds[best] ? index : best),
          0,
        );
      }
      rowEnds[row] = left + nextWidth;
      const top = laneTop + 35 + row * group.rowHeight;

      if (card.style.width !== `${nextWidth}px`) card.style.width = `${nextWidth}px`;
      if (card.style.left !== `${left}px`) card.style.left = `${left}px`;
      if (card.style.top !== `${top}px`) card.style.top = `${top}px`;
      card.classList.add("school-readable-card");
      card.classList.remove("is-compact");
    });
  });

  updateLinks(canvas);
}

export function installSchoolLayout() {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      arrangeCards();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("wheel", () => window.setTimeout(schedule, 45), true);
  document.addEventListener("pointerup", () => window.setTimeout(schedule, 45), true);
  document.addEventListener("input", () => window.setTimeout(schedule, 45), true);
  schedule();
}
