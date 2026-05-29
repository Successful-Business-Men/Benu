// Apple-style "hello" handwriting effect for the Benu brand word.
// Uses the browser-native Web Animations API (no external library), and is
// designed to FAIL SAFE: the resting state of every stroke is fully drawn and
// visible, so even if animation is unsupported the word "Benu." still shows.

class BenuHelloEffect {
  constructor(targetElement, options = {}) {
    this.target = targetElement;
    this.speed = options.speed || 1;
    this.onComplete = options.onComplete || null;
    this.originalHTML = targetElement ? targetElement.innerHTML : "";
    this.svg = null;
  }

  calc(x) {
    return x * this.speed;
  }

  createSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 250 130");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "9");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-label", "Benu");
    svg.style.height = "0.95em";
    svg.style.width = "auto";
    svg.style.display = "inline-block";
    svg.style.verticalAlign = "-0.12em";
    svg.style.marginLeft = "0.08em";
    svg.style.color = "inherit";
    svg.style.overflow = "visible";

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "Benu";
    svg.appendChild(title);

    return svg;
  }

  createPath(d) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    // Resting state = fully drawn and visible (fail-safe default).
    path.style.opacity = "1";
    return path;
  }

  animatePath(path, duration, delay = 0) {
    let length = 0;
    try {
      length = path.getTotalLength();
    } catch (e) {
      length = 0;
    }

    // If we can't measure the path or WAAPI is missing, leave it drawn/visible.
    if (!length || typeof path.animate !== "function") {
      return Promise.resolve();
    }

    // Prime the stroke as "undrawn" then animate it on.
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.opacity = "0";

    const anim = path.animate(
      [
        { strokeDashoffset: length, opacity: 1, offset: 0 },
        { strokeDashoffset: 0, opacity: 1, offset: 1 }
      ],
      {
        duration: duration,
        delay: delay,
        easing: "ease-in-out",
        fill: "forwards"
      }
    );

    return anim.finished
      .then(() => {
        // Lock the drawn state so nothing reverts.
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      })
      .catch(() => {
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      });
  }

  render() {
    try {
      this.svg = this.createSVG();

      // Geometric "Benu." letterforms.
      const paths = [
        {
          // B
          d: "M22 25 L22 100 M22 25 Q48 25 48 44 Q48 62 22 62 M22 62 Q52 62 52 82 Q52 100 22 100",
          duration: this.calc(700),
          delay: this.calc(0)
        },
        {
          // e
          d: "M70 80 L104 80 Q104 58 87 58 Q70 58 70 79 Q70 100 88 100 Q99 100 104 93",
          duration: this.calc(520),
          delay: this.calc(650)
        },
        {
          // n
          d: "M122 100 L122 60 M122 70 Q122 58 138 58 Q154 58 154 72 L154 100",
          duration: this.calc(450),
          delay: this.calc(1150)
        },
        {
          // u
          d: "M170 58 L170 86 Q170 100 186 100 Q202 100 202 86 L202 58 M202 58 L202 100",
          duration: this.calc(450),
          delay: this.calc(1600)
        },
        {
          // dot (period)
          d: "M218 96 Q218 92 222 92 Q226 92 226 96 Q226 100 222 100 Q218 100 218 96",
          duration: this.calc(180),
          delay: this.calc(2050)
        }
      ];

      const pathElements = paths.map(({ d }) => {
        const path = this.createPath(d);
        this.svg.appendChild(path);
        return path;
      });

      // Swap in the SVG (text replaced only after SVG is successfully built).
      this.target.innerHTML = "";
      this.target.appendChild(this.svg);

      const animations = pathElements.map((path, i) =>
        this.animatePath(path, paths[i].duration, paths[i].delay)
      );

      Promise.all(animations).then(() => {
        if (this.onComplete) this.onComplete();
      });
    } catch (err) {
      // Hard fallback: never let "Benu." disappear.
      console.warn("Benu hello effect failed, restoring text:", err);
      if (this.target) this.target.innerHTML = this.originalHTML;
    }
  }
}

function initBenuEffect() {
  const brandAccent = document.getElementById("brand-accent");
  if (!brandAccent) return;

  // Respect reduced-motion preferences: keep the static text.
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  setTimeout(() => {
    const effect = new BenuHelloEffect(brandAccent, { speed: 1.0 });
    effect.render();
  }, 600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBenuEffect);
} else {
  initBenuEffect();
}
