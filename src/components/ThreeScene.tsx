import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Sliders,
  Cpu,
  Dna,
  Shield,
  Eye,
} from 'lucide-react';

interface ThreeSceneProps {
  isSpeaking?: boolean;
  isProcessing?: boolean;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ isSpeaking = false, isProcessing = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<'dexter_core' | 'molecular' | 'pc_rig'>('dexter_core');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // References for live updates to the render loop
  const speakingRef = useRef(isSpeaking);
  const processingRef = useRef(isProcessing);
  const wireframeRef = useRef(wireframe);
  const autoRotateRef = useRef(autoRotate);
  const modeRef = useRef(activeMode);

  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    wireframeRef.current = wireframe;
  }, [wireframe]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    modeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.05);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.5);

    // 3. WebGL Renderer with PBR color management
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Lighting (RoomEnvironment PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 5. Studio Key & Fill Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 3.0);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x10b981, 0x0284c7, 1.2);
    fillLight.position.set(0, 6, 0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // 6. Contact Shadow Canvas Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const gradient = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    scene.add(shadowPlane);

    // 7. Ground Grid Floor
    const gridHelper = new THREE.GridHelper(16, 32, 0x10b981, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // =========================================================================
    // MODEL 1: Dexter Procedural Robot Core (Composite 10-Part Group)
    // =========================================================================
    const dexterGroup = new THREE.Group();
    dexterGroup.position.set(0, 0, 0);

    // Shared PBR Materials with varied roughness and metalness
    const darkChassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });

    const brushedAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.15,
    });

    const glowingVisorMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    const coreReactorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.2,
      roughness: 0.05,
      metalness: 0.1,
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Part 1: Primary Silhouette - Articulated Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.25, 32);
    const baseMesh = new THREE.Mesh(baseGeo, darkChassisMat);
    baseMesh.position.y = 0.125;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    dexterGroup.add(baseMesh);

    // Part 2: Primary Silhouette - Lower Spine Column
    const spineGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.6, 24);
    const spineMesh = new THREE.Mesh(spineGeo, brushedAlloyMat);
    spineMesh.position.y = 0.55;
    spineMesh.castShadow = true;
    dexterGroup.add(spineMesh);

    // Part 3: Secondary Detail - Quantum Reactor Torso
    const torsoGeo = new THREE.BoxGeometry(1.0, 0.9, 0.7);
    const torsoMesh = new THREE.Mesh(torsoGeo, darkChassisMat);
    torsoMesh.position.y = 1.25;
    torsoMesh.castShadow = true;
    dexterGroup.add(torsoMesh);

    // Part 4: Secondary Detail - Core Glowing Reactor Orb inside Torso
    const reactorGeo = new THREE.SphereGeometry(0.28, 32, 32);
    const reactorOrb = new THREE.Mesh(reactorGeo, coreReactorMat);
    reactorOrb.position.set(0, 1.25, 0.28);
    dexterGroup.add(reactorOrb);

    // Part 5: Secondary Detail - Floating Gyroscopic Quantum Ring 1
    const ring1Geo = new THREE.TorusGeometry(0.75, 0.03, 16, 64);
    const ring1Mesh = new THREE.Mesh(ring1Geo, goldAccentMat);
    ring1Mesh.position.y = 1.25;
    dexterGroup.add(ring1Mesh);

    // Part 6: Secondary Detail - Floating Gyroscopic Quantum Ring 2
    const ring2Geo = new THREE.TorusGeometry(0.88, 0.025, 16, 64);
    const ring2Mesh = new THREE.Mesh(ring2Geo, brushedAlloyMat);
    ring2Mesh.position.y = 1.25;
    dexterGroup.add(ring2Mesh);

    // Part 7: Accent Detail - Left Shoulder Pylon
    const pylonLeftGeo = new THREE.BoxGeometry(0.2, 0.4, 0.3);
    const pylonLeft = new THREE.Mesh(pylonLeftGeo, brushedAlloyMat);
    pylonLeft.position.set(-0.65, 1.45, 0);
    pylonLeft.castShadow = true;
    dexterGroup.add(pylonLeft);

    // Part 8: Accent Detail - Right Shoulder Pylon
    const pylonRight = pylonLeft.clone();
    pylonRight.position.set(0.65, 1.45, 0);
    dexterGroup.add(pylonRight);

    // Part 9: Secondary Detail - Articulated Sensor Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.95, 0);

    const headHullGeo = new THREE.BoxGeometry(0.6, 0.45, 0.55);
    const headHull = new THREE.Mesh(headHullGeo, darkChassisMat);
    headHull.castShadow = true;
    headGroup.add(headHull);

    // Part 10: Accent Detail - Curved Glowing Visor (Lathe / Tube profile)
    const visorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 32, 1, false, 0, Math.PI);
    const visorMesh = new THREE.Mesh(visorGeo, glowingVisorMat);
    visorMesh.rotation.y = -Math.PI / 2;
    visorMesh.position.set(0, 0.04, 0.28);
    headGroup.add(visorMesh);

    // Top Antenna / Comms Array
    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.35, 12);
    const antenna = new THREE.Mesh(antennaGeo, goldAccentMat);
    antenna.position.set(0.18, 0.38, -0.1);
    headGroup.add(antenna);

    dexterGroup.add(headGroup);
    scene.add(dexterGroup);

    // =========================================================================
    // MODEL 2: Molecular Bioscience Visualization (DNA Helix & Protein Complex)
    // =========================================================================
    const molecularGroup = new THREE.Group();
    molecularGroup.position.set(0, 1.3, 0);
    molecularGroup.visible = false;

    // Build procedural double helix with nucleotide base pairs
    const helixRadius = 0.7;
    const helixHeight = 2.4;
    const strandPairs = 32;

    const strandMat1 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.5 });
    const strandMat2 = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.2, metalness: 0.5 });
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.6 });

    const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const bondGeo = new THREE.CylinderGeometry(0.025, 0.025, 1, 12);

    for (let i = 0; i < strandPairs; i++) {
      const t = i / strandPairs;
      const angle = t * Math.PI * 4;
      const y = (t - 0.5) * helixHeight;

      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;
      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;

      // Strand 1 node
      const node1 = new THREE.Mesh(sphereGeo, strandMat1);
      node1.position.set(x1, y, z1);
      molecularGroup.add(node1);

      // Strand 2 node
      const node2 = new THREE.Mesh(sphereGeo, strandMat2);
      node2.position.set(x2, y, z2);
      molecularGroup.add(node2);

      // Cross bond rungs
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      bond.scale.set(1, helixRadius * 2, 1);
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize());
      molecularGroup.add(bond);
    }
    scene.add(molecularGroup);

    // =========================================================================
    // OrbitControls with exponential damping
    // =========================================================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go below ground
    controls.target.set(0, 1.2, 0);

    // Pre-allocated scratch objects for garbage-free 60fps loop
    const clock = new THREE.Clock();
    const mouseTarget = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseTarget.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 500;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. 60 FPS Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update Controls
      controls.update();

      const currentMode = modeRef.current;
      dexterGroup.visible = currentMode === 'dexter_core' || currentMode === 'pc_rig';
      molecularGroup.visible = currentMode === 'molecular';

      // Update Materials Wireframe state
      const isWire = wireframeRef.current;
      darkChassisMat.wireframe = isWire;
      brushedAlloyMat.wireframe = isWire;
      glowingVisorMat.wireframe = isWire;
      strandMat1.wireframe = isWire;
      strandMat2.wireframe = isWire;

      // Animate Dexter Gyro Rings
      const rotSpeed = autoRotateRef.current ? 1.0 : 0.2;
      ring1Mesh.rotation.x = time * 1.5 * rotSpeed;
      ring1Mesh.rotation.y = time * 2.0 * rotSpeed;
      ring2Mesh.rotation.y = -time * 1.8 * rotSpeed;
      ring2Mesh.rotation.z = time * 1.2 * rotSpeed;

      // Animate Reactor Breathing / Speaking Pulse
      const isTalking = speakingRef.current;
      const isWork = processingRef.current;
      const pulseSpeed = isTalking ? 8.0 : isWork ? 5.0 : 2.0;
      const pulseScale = 1.0 + Math.sin(time * pulseSpeed) * 0.08;
      reactorOrb.scale.set(pulseScale, pulseScale, pulseScale);

      // Color intensity shift on speaking
      if (isTalking) {
        glowingVisorMat.emissiveIntensity = 1.2 + Math.sin(time * 12) * 0.5;
        coreReactorMat.emissiveIntensity = 1.8 + Math.sin(time * 10) * 0.4;
      } else if (isWork) {
        glowingVisorMat.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.3;
        coreReactorMat.emissiveIntensity = 1.4;
      } else {
        glowingVisorMat.emissiveIntensity = 0.7;
        coreReactorMat.emissiveIntensity = 1.1;
      }

      // Smooth Head Tracking towards mouse
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, mouseTarget.x * 0.45, 0.08);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -mouseTarget.y * 0.25, 0.08);

      // Float hovering animation on main body
      dexterGroup.position.y = Math.sin(time * 1.8) * 0.04;

      // Animate Molecular Helix Rotation
      if (molecularGroup.visible) {
        molecularGroup.rotation.y = time * 0.6;
        molecularGroup.position.y = 1.2 + Math.sin(time * 1.5) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      controls.dispose();
      renderer.dispose();
      envTexture.dispose();
      shadowTexture.dispose();

      // Dispose geometries & materials
      baseGeo.dispose();
      spineGeo.dispose();
      torsoGeo.dispose();
      reactorGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      pylonLeftGeo.dispose();
      headHullGeo.dispose();
      visorGeo.dispose();
      antennaGeo.dispose();
      sphereGeo.dispose();
      bondGeo.dispose();

      darkChassisMat.dispose();
      brushedAlloyMat.dispose();
      glowingVisorMat.dispose();
      coreReactorMat.dispose();
      goldAccentMat.dispose();
      strandMat1.dispose();
      strandMat2.dispose();
      bondMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Viewport-First Control Dock (Compact <= 15% footprint) */}
      <div
        className={`absolute bottom-4 right-4 z-20 transition-all duration-300 ${
          collapsed ? 'translate-y-0' : ''
        }`}
      >
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md space-y-2.5 text-xs text-slate-200 w-64">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D Engine Controls</span>
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:text-white rounded"
              title="Toggle dock"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {!collapsed && (
            <>
              {/* Scene Switcher */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Active 3D Subject
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setActiveMode('dexter_core')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                      activeMode === 'dexter_core'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Dexter Core
                  </button>

                  <button
                    onClick={() => setActiveMode('molecular')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-colors ${
                      activeMode === 'molecular'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Bio Double-Helix
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 transition-colors ${
                    autoRotate
                      ? 'bg-slate-800 text-emerald-400 border-slate-700'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rotation</span>
                </button>

                <button
                  onClick={() => setWireframe(!wireframe)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 transition-colors ${
                    wireframe
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Wireframe</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
                Drag to orbit · Scroll to zoom
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Left Live Status Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs font-mono text-slate-300 backdrop-blur">
          <span
            className={`w-2 h-2 rounded-full ${
              isSpeaking
                ? 'bg-emerald-400 animate-ping'
                : isProcessing
                ? 'bg-teal-400 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span>
            {isSpeaking
              ? 'Voice Emitting (Audio Reactive)'
              : isProcessing
              ? 'Processing Task'
              : 'Interactive 3D Viewport'}
          </span>
        </div>
      </div>
    </div>
  );
};
