import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useFBX, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Spinning cube while FBX loads ─────────────────────────────────────────
function Loader() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => { ref.current.rotation.y += dt * 1.8 })
  return (
    <mesh ref={ref} position={[0, 1.5, 0]}>
      <boxGeometry args={[1.2, 1.8, 1.2]} />
      <meshStandardMaterial color="#2B8C80" wireframe opacity={0.7} transparent />
    </mesh>
  )
}

// ── Model: cloned per mount so cached FBX is never mutated ─────────────────
function Model() {
  const raw    = useFBX('/uploads_files_2437298_0001.fbx')
  // Each mount gets its own deep clone — fixes double-scale when switching pages
  const fbx    = useMemo(() => raw.clone(true), [raw])
  const group  = useRef<THREE.Group>(null!)
  const { camera } = useThree()

  useEffect(() => {
    // 1. Normalize to 3-unit height
    const box  = new THREE.Box3().setFromObject(fbx)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale  = maxDim > 0 ? 3 / maxDim : 1
    fbx.scale.setScalar(scale)

    // 2. Center horizontally, sit on ground
    box.setFromObject(fbx)
    const center = new THREE.Vector3()
    box.getCenter(center)
    fbx.position.set(-center.x, -box.min.y, -center.z)

    // 3. Aim THIS canvas's camera at the building centre — no shared ref needed
    box.setFromObject(fbx)
    const cy = (box.max.y + box.min.y) / 2
    camera.lookAt(0, cy, 0)
    camera.updateProjectionMatrix()

    // 4. Enable shadows
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow    = true
        child.receiveShadow = true
      }
    })
  }, [fbx, camera])

  // Left/right rotation only — X axis always snaps back to 0
  useFrame(({ mouse }) => {
    const el = group.current
    if (!el) return
    el.rotation.y += (mouse.x * Math.PI * 0.55 - el.rotation.y) * 0.06
    el.rotation.x += (0 - el.rotation.x) * 0.06
  })

  return (
    <group ref={group}>
      <primitive object={fbx} />
    </group>
  )
}

// ── Public component ───────────────────────────────────────────────────────
export function Building3D() {
  return (
    <div className="absolute inset-0 pointer-events-auto" style={{ cursor: 'ew-resize' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 6.5], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 10, 6]}  intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 3, -4]} intensity={0.25} color="#cce8f0" />
        <pointLight position={[0, 4, 0]}    intensity={0.65} color="#2B8C80" />
        <pointLight position={[-2, 1, 3]}   intensity={0.40} color="#3aaa9c" />
        <pointLight position={[2, 0.5, -2]} intensity={0.25} color="#2B8C80" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a1f1c" roughness={0.9} metalness={0.1} transparent opacity={0.5} />
        </mesh>

        <Suspense fallback={<Loader />}>
          <Model />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      <p
        className="absolute bottom-5 left-1/2 -translate-x-1/2 font-medium tracking-widest uppercase whitespace-nowrap pointer-events-none"
        style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}
      >
        إقامتي · IQAMATI
      </p>
    </div>
  )
}
