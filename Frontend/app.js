// --- Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorGlow = document.getElementById('cursor-glow');

let mouseX = -100;
let mouseY = -100;
let glowX = -100;
let glowY = -100;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  
  // Instant update for dot
  cursorDot.style.left = `${mouseX}px`;
  cursorDot.style.top = `${mouseY}px`;
});

// Smooth follow for glow
function animateCursor() {
  glowX += (mouseX - glowX) * 0.15;
  glowY += (mouseY - glowY) * 0.15;
  
  cursorGlow.style.left = `${glowX}px`;
  cursorGlow.style.top = `${glowY}px`;
  
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Interactive element hover effect
const interactables = document.querySelectorAll('button, select, a, .glass-card');
interactables.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorGlow.style.transform = 'translate(-50%, -50%) scale(1.5)';
  });
  el.addEventListener('mouseleave', () => {
    cursorGlow.style.transform = 'translate(-50%, -50%) scale(1)';
  });
});

// --- Three.js Scene ---
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Neural Graph Nodes & Edges
const graphGroup = new THREE.Group();
scene.add(graphGroup);

const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.6 });

const nodes = [];
for(let i=0; i<50; i++) {
  const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
  mesh.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 15
  );
  graphGroup.add(mesh);
  nodes.push(mesh.position);
}

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x818CF8, transparent: true, opacity: 0.15 });
for(let i=0; i<nodes.length; i++) {
  for(let j=i+1; j<nodes.length; j++) {
    if(nodes[i].distanceTo(nodes[j]) < 5) {
      const geometry = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
      const line = new THREE.Line(geometry, lineMaterial);
      graphGroup.add(line);
    }
  }
}

// Particle System
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);
for(let i=0; i<particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 30;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  depthWrite: false
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll & Mouse info for 3D
let scrollY = window.scrollY;
let targetCameraZ = 15;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  // Calculate a normalized scroll value to push camera forward
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = scrollY / maxScroll;
  targetCameraZ = 15 - (scrollProgress * 20); // Push forward by up to 20 units
});

let normMouseX = 0;
let normMouseY = 0;
document.addEventListener('mousemove', (e) => {
  normMouseX = (e.clientX / window.innerWidth) * 2 - 1;
  normMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

const clock = new THREE.Clock();

let explosionForce = 0;
document.addEventListener('mousedown', () => {
  explosionForce = 0.5;
});

function animateThree() {
  const elapsedTime = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Rotate graph
  graphGroup.rotation.y = elapsedTime * 0.05;
  graphGroup.rotation.x = elapsedTime * 0.02;

  // Drift particles
  particlesMesh.rotation.y += 0.001;
  particlesMesh.rotation.x += 0.0005;
  
  // Particles react to mouse and clicks
  if (explosionForce > 0) {
    particlesMesh.scale.x += explosionForce;
    particlesMesh.scale.y += explosionForce;
    particlesMesh.scale.z += explosionForce;
    explosionForce -= 0.02;
  } else {
    particlesMesh.scale.x += (1 - particlesMesh.scale.x) * 0.05;
    particlesMesh.scale.y += (1 - particlesMesh.scale.y) * 0.05;
    particlesMesh.scale.z += (1 - particlesMesh.scale.z) * 0.05;
  }

  particlesMesh.position.x += (normMouseX * 2 - particlesMesh.position.x) * 0.02;
  particlesMesh.position.y += (normMouseY * 2 - particlesMesh.position.y) * 0.02;

  // Camera Dolly
  camera.position.z += (targetCameraZ - camera.position.z) * 0.1;

  // Parallax rings
  const ring1 = document.querySelector('.ring-1');
  const ring2 = document.querySelector('.ring-2');
  if(ring1 && ring2) {
    ring1.style.transform = `translate(-50%, -50%) translate(${normMouseX * -20}px, ${normMouseY * -20}px)`;
    ring2.style.transform = `translate(-50%, -50%) translate(${normMouseX * 30}px, ${normMouseY * 30}px)`;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animateThree);
}
animateThree();


// --- Scroll Jacking Animation for How It Works ---
const hiwSection = document.getElementById('how-it-works');
const cards = document.querySelectorAll('.agent-card');

window.addEventListener('scroll', () => {
  const rect = hiwSection.getBoundingClientRect();
  const sectionTop = rect.top;
  const sectionHeight = rect.height;
  const windowHeight = window.innerHeight;
  
  // Calculate progress of this specific section (0 to 1)
  // Starts when sticky container hits top
  if(sectionTop > 0 || sectionTop < -(sectionHeight - windowHeight)) {
    return; // Out of sticky range
  }
  
  const scrollProgress = Math.abs(sectionTop) / (sectionHeight - windowHeight);
  
  // 5 cards. Each card has a window of ~0.2
  cards.forEach((card, i) => {
    const start = i * 0.18;
    const end = start + 0.25;
    
    if (scrollProgress >= start && scrollProgress <= end) {
      // In view
      // Map local progress to 0 -> 1 -> 0
      const localP = (scrollProgress - start) / (end - start);
      
      let y, opacity, scale;
      if (localP < 0.2) {
        // Entering
        const p = localP / 0.2;
        y = 50 * (1 - p);
        opacity = p;
        scale = 0.95 + (0.05 * p);
      } else if (localP > 0.8) {
        // Exiting
        const p = (localP - 0.8) / 0.2;
        y = -50 * p;
        opacity = 1 - p;
        scale = 1 - (0.05 * p);
      } else {
        // Holding
        y = 0; opacity = 1; scale = 1;
      }
      
      card.style.transform = `translateY(calc(-50% + ${y}px)) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.pointerEvents = 'auto';
    } else {
      // Out of view
      card.style.opacity = 0;
      card.style.pointerEvents = 'none';
      if(scrollProgress < start) {
        card.style.transform = `translateY(calc(-50% + 50px))`;
      } else {
        card.style.transform = `translateY(calc(-50% - 50px))`;
      }
    }
  });
});


// --- Demo Panel Logic ---
const runBtn = document.getElementById('run-btn');
const runBtnText = document.getElementById('run-btn-text');
const playIcon = document.querySelector('.play-icon');
const spinnerIcon = document.querySelector('.spinner-icon');
const terminalOutput = document.getElementById('terminal-output');
const procIndicator = document.getElementById('processing-indicator');
const confContainer = document.getElementById('confidence-container');
const arcValue = document.getElementById('arc-value');
const arcText = document.getElementById('arc-text');

const steps = [
  { id: 1, text: "[Agent 1] Failure detected in build #247", delay: 500 },
  { id: 2, text: "[Agent 2] Classification: dependency_error — confidence 94%", delay: 1500, conf: 94 },
  { id: 3, text: "[Agent 3] Root cause: pandas removed from requirements.txt in commit a3f92c", delay: 3000 },
  { 
    id: 4, 
    text: "[Agent 4] Fix generated: requirements.txt patch", 
    isDiff: true,
    diffContent: "--- requirements.txt\n+++ requirements.txt\n@@ -1,3 +1,4 @@\n numpy==1.24.3\n-scipy==1.10.1\n+scipy==1.10.1\n+pandas==2.0.3",
    delay: 5000 
  },
  { id: 5, text: "[Agent 5] Validation: PASSED — pipeline green", delay: 7000, success: true }
];

function createLogEntry(step) {
  const div = document.createElement('div');
  div.className = `log-entry ${step.success ? 'success' : ''}`;
  
  const iconHtml = step.success 
    ? `<svg class="log-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg class="log-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    
  let contentHtml = `<div style="flex:1"><p>${step.text}</p>`;
  
  if (step.isDiff) {
    const diffLines = step.diffContent.split('\n').map(line => {
      let cClass = 'context';
      if(line.startsWith('+')) cClass = 'add';
      if(line.startsWith('-')) cClass = 'remove';
      return `<div class="diff-line ${cClass}">${line}</div>`;
    }).join('');
    contentHtml += `<div class="diff-block"><pre>${diffLines}</pre></div>`;
  }
  
  contentHtml += `</div>`;
  div.innerHTML = iconHtml + contentHtml;
  return div;
}

runBtn.addEventListener('click', () => {
  // Reset
  document.querySelectorAll('.log-entry').forEach(el => el.remove());
  confContainer.classList.add('hidden');
  arcValue.style.strokeDashoffset = 150.72;
  arcText.textContent = "0%";
  
  // UI Loading State
  runBtn.disabled = true;
  runBtnText.textContent = "Processing...";
  playIcon.classList.add('hidden');
  spinnerIcon.classList.remove('hidden');
  procIndicator.classList.remove('hidden');
  
  steps.forEach(step => {
    setTimeout(() => {
      const entry = createLogEntry(step);
      terminalOutput.insertBefore(entry, procIndicator);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      
      if(step.conf) {
        confContainer.classList.remove('hidden');
        // Animate arc
        setTimeout(() => {
          const offset = 150.72 - (step.conf / 100) * 150.72;
          arcValue.style.strokeDashoffset = offset;
          animateValue(arcText, 0, step.conf, 1000, "%");
        }, 100);
      }
    }, step.delay);
  });
  
  setTimeout(() => {
    runBtn.disabled = false;
    runBtnText.textContent = "Run Diagnosis";
    playIcon.classList.remove('hidden');
    spinnerIcon.classList.add('hidden');
    procIndicator.classList.add('hidden');
  }, steps[steps.length-1].delay + 1000);
});

function animateValue(obj, start, end, duration, suffix = "") {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// --- Metrics Animation ---
const observerOptions = { threshold: 0.5 };
const metricsObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        animateValue(counter, 0, target, 2000);
      });
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

const metricsSection = document.getElementById('metrics');
if(metricsSection) {
  metricsObserver.observe(metricsSection);
}
