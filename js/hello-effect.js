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
    svg.setAttribute("viewBox", "0 0 350 200");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "12");
    svg.style.height = "100%";
    svg.style.width = "auto";
    svg.style.display = "inline-block";
    svg.style.verticalAlign = "middle";
    
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
        d: "M20 50 Q20 30 40 30 Q60 30 60 50 Q60 70 40 70 M40 70 Q70 70 70 95 Q70 120 40 120 Q20 120 20 95 L20 50",
        duration: this.calc(800),
        delay: 0
      },
      {
        // e
        d: "M90 95 Q90 70 115 70 Q140 70 140 95 Q140 120 115 120 Q90 120 90 105 L90 100 L140 95",
        duration: this.calc(500),
        delay: this.calc(300)
      },
      {
        // n
        d: "M160 120 L160 75 Q160 70 170 70 Q180 70 180 75 L180 120",
        duration: this.calc(400),
        delay: this.calc(600)
      },
      {
        // u
        d: "M200 70 L200 105 Q200 120 220 120 Q240 120 240 105 L240 70",
        duration: this.calc(400),
        delay: this.calc(900)
      },
      {
        // dot (period)
        d: "M260 115 Q260 110 265 110 Q270 110 270 115 Q270 120 265 120 Q260 120 260 115",
        duration: this.calc(200),
        delay: this.calc(1200)
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
