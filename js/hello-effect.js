// Apple Hello Effect - Vanilla JS implementation using Motion.js
// Replaces "Benu." text with animated handwriting effect

class BenuHelloEffect {
  constructor(targetElement, options = {}) {
    this.target = targetElement;
    this.speed = options.speed || 1;
    this.onComplete = options.onComplete || null;
    this.svg = null;
  }

  calc(x) {
    return x * this.speed;
  }

  createSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 290 150");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "8");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.height = "1em";
    svg.style.width = "auto";
    svg.style.display = "inline-block";
    svg.style.verticalAlign = "baseline";
    svg.style.marginLeft = "0.1em";
    svg.style.color = "inherit";
    
    // Title for accessibility
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
    
    // Calculate path length for stroke animation
    const length = 1000; // Approximate, will be calculated
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.opacity = "0";
    
    return path;
  }

  async animatePath(path, duration, delay = 0) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    // Use Motion.animate from the CDN
    return new Promise((resolve) => {
      Motion.animate(
        path,
        { 
          strokeDashoffset: 0,
          opacity: 1
        },
        { 
          duration: duration / 1000,
          easing: "ease-in-out"
        }
      ).finished.then(resolve);
    });
  }

  async render() {
    // Create SVG container
    this.svg = this.createSVG();
    
    // Simplified "Benu" handwriting path (custom design)
    const paths = [
      {
        // B
        d: "M15 35 Q15 20 30 20 Q45 20 45 35 Q45 50 30 50 M30 50 Q50 50 50 70 Q50 90 30 90 Q15 90 15 70 L15 35",
        duration: this.calc(700),
        delay: 0
      },
      {
        // e
        d: "M70 70 Q70 50 90 50 Q110 50 110 70 Q110 90 90 90 Q70 90 70 75 L70 70 L110 65",
        duration: this.calc(450),
        delay: this.calc(250)
      },
      {
        // n
        d: "M130 90 L130 55 Q130 50 140 50 Q150 50 150 55 L150 90",
        duration: this.calc(350),
        delay: this.calc(500)
      },
      {
        // u
        d: "M170 50 L170 75 Q170 90 185 90 Q200 90 200 75 L200 50",
        duration: this.calc(350),
        delay: this.calc(700)
      },
      {
        // dot (period)
        d: "M220 85 Q220 82 223 82 Q226 82 226 85 Q226 88 223 88 Q220 88 220 85",
        duration: this.calc(150),
        delay: this.calc(900)
      }
    ];

    // Create and append all paths
    const pathElements = paths.map(({ d }) => {
      const path = this.createPath(d);
      this.svg.appendChild(path);
      return path;
    });

    // Replace target element content
    this.target.innerHTML = '';
    this.target.appendChild(this.svg);

    // Animate paths with their delays
    const animations = pathElements.map((path, i) => 
      this.animatePath(path, paths[i].duration, paths[i].delay)
    );

    await Promise.all(animations);

    if (this.onComplete) {
      this.onComplete();
    }
  }

  destroy() {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBenuEffect);
} else {
  initBenuEffect();
}

function initBenuEffect() {
  const brandAccent = document.getElementById('brand-accent');
  if (!brandAccent || typeof Motion === 'undefined') {
    console.warn('Motion library or brand-accent element not found');
    return;
  }

  // Wait for fonts and initial layout
  setTimeout(() => {
    const effect = new BenuHelloEffect(brandAccent, {
      speed: 1.0,
      onComplete: () => {
        console.log('Benu hello effect completed');
      }
    });
    
    effect.render();
  }, 800);
}
