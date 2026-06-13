import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ── App primary color (matches CSS --primary) ── */
const PRIMARY    = 0x3b82f6   // blue-500
const PRIMARY_HX = '#3b82f6'
const BG_SCENE   = 0xF0F2F5   // app grey background

type ViewMode = 'top' | 'iso' | 'corridor' | 'free'

interface Cfg { floors: number; apts: number; aw: number; ad: number; cw: number }

interface Props {
  initialCfg?:   Partial<Cfg>
  viewOnly?:     boolean
  showControls?: boolean
  label?:        string
}

export function Building3DViewer({ initialCfg, viewOnly = false, showControls = false, label }: Props = {}) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threeRef  = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    buildingGrp: THREE.Group | null
    hitMeshes: THREE.Mesh[]
    drawerOffset: number[]
    drawerTarget: number[]
    animating: boolean
    currentFloorWalk: number
    viewMode: ViewMode
  } | null>(null)

  const [cfg, setCfg] = useState<Cfg>({ floors: 4, apts: 3, aw: 9, ad: 11, cw: 2.4, ...initialCfg })
  const [viewMode,       setViewMode]       = useState<ViewMode>('iso')
  const [currentFloor,   setCurrentFloor]   = useState(0)
  const [floorInfo,      setFloorInfo]      = useState('Floor 1 of 4')
  const [tooltip,        setTooltip]        = useState<{ x:number; y:number; html:string } | null>(null)
  const [zoom,           setZoom]           = useState(93)
  const [viewLabel,      setViewLabel]      = useState('Isometric View')

  /* ── Stats ── */
  const stats = {
    unitsPerFloor: cfg.apts * 2,
    areaEach: Math.round(cfg.aw * cfg.ad),
    totalUnits: cfg.floors * cfg.apts * 2,
    footprint: Math.round((cfg.apts * cfg.aw + 3.8) * (cfg.ad * 2 + cfg.cw)),
  }

  /* ═══════════════════════════════════════════════════════
     THREE.JS INIT — runs once
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    const wrap   = wrapRef.current!
    const canvas = canvasRef.current!

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(wrap.clientWidth, wrap.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BG_SCENE)

    const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 500)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 2
    controls.maxDistance = 200
    controls.maxPolarAngle = Math.PI * 0.90

    // Lights
    const sun = new THREE.DirectionalLight(0xFFFFFF, 4.0)
    sun.position.set(-15, 40, -10)
    sun.castShadow = true
    sun.shadow.mapSize.set(4096, 4096)
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 120
    sun.shadow.camera.left = sun.shadow.camera.bottom = -55
    sun.shadow.camera.right = sun.shadow.camera.top = 55
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0xF5F0E8, 2.5))
    const fill = new THREE.DirectionalLight(0xE0EEFF, 0.8)
    fill.position.set(20, 15, 25); scene.add(fill)

    threeRef.current = {
      renderer, scene, camera, controls,
      buildingGrp: null, hitMeshes: [],
      drawerOffset: [], drawerTarget: [],
      animating: false, currentFloorWalk: 0, viewMode: 'iso',
    }

    // Animate loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)

      const t = threeRef.current
      if (!t) return
      const { floors: _f, apts: _a, aw: _aw, ad: _ad, cw: _cw } = cfg
      const _WH=3.2,_ST=0.18,_STW=3.8,_TW=_a*_aw,_TD=_ad*2+_cw,_FW=_TW+_STW
      const defDist = Math.max(_FW,_TD,_f*(_WH+_ST)) * 1.2
      const curDist = camera.position.distanceTo(controls.target)
      setZoom(Math.max(10, Math.round((defDist / curDist) * 100)))
    }
    animate()

    // Resize
    const onResize = () => {
      camera.aspect = wrap.clientWidth / wrap.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(wrap.clientWidth, wrap.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ═══════════════════════════════════════════════════════
     BUILD — runs whenever cfg changes
  ═══════════════════════════════════════════════════════ */
  const build = useCallback(() => {
    const t = threeRef.current
    if (!t) return

    if (t.buildingGrp) t.scene.remove(t.buildingGrp)
    t.buildingGrp = new THREE.Group()
    t.hitMeshes   = []

    const { floors, apts, aw, ad, cw } = cfg
    const WT=0.28, ST=0.18, STW=3.8, WallH=3.2, FloorH=WallH+ST
    const TW=apts*aw, TD=ad*2+cw, FW=TW+STW
    const ox=-FW/2, oz=-TD/2

    // Materials — app colors
    const mkTex = (fn: (ctx:CanvasRenderingContext2D,w:number,h:number)=>void, w=512, h=512) => {
      const c = Object.assign(document.createElement('canvas'), {width:w, height:h})
      fn(c.getContext('2d')!, w, h)
      const t2 = new THREE.CanvasTexture(c)
      t2.wrapS = t2.wrapT = THREE.RepeatWrapping
      return t2
    }
    const WOOD = mkTex((ctx,w,h)=>{
      ctx.fillStyle='#7B6B59'; ctx.fillRect(0,0,w,h)
      for(let y=0;y<h;y+=20){ctx.fillStyle=`rgba(0,0,0,${0.06+Math.random()*0.08})`;ctx.fillRect(0,y,w,1.5)}
    }); WOOD.repeat.set(2,2)
    const TILE = mkTex((ctx,w,h)=>{
      ctx.fillStyle='#D5D0C8'; ctx.fillRect(0,0,w,h)
      const ts=40
      for(let x=0;x<w;x+=ts) for(let y=0;y<h;y+=ts){
        ctx.fillStyle='rgba(255,255,255,0.20)'; ctx.fillRect(x+1,y+1,ts-2,ts-2)
        ctx.strokeStyle='rgba(150,145,138,0.55)'; ctx.lineWidth=1.2; ctx.strokeRect(x,y,ts,ts)
      }
    }); TILE.repeat.set(3,3)
    const WALL_TEX = mkTex((ctx,w,h)=>{
      ctx.fillStyle='#F3F0EA'; ctx.fillRect(0,0,w,h)
      for(let i=0;i<300;i++){ctx.fillStyle=`rgba(0,0,0,${Math.random()*0.015})`;ctx.fillRect(Math.random()*w,Math.random()*h,Math.random()*5,Math.random()*5)}
    })

    const M: Record<string, THREE.MeshStandardMaterial> = {
      wall:      new THREE.MeshStandardMaterial({map:WALL_TEX, roughness:0.88, color:0xF5F2EC}),
      wallDark:  new THREE.MeshStandardMaterial({roughness:0.90, color:0xE0DDD6}),
      wood:      new THREE.MeshStandardMaterial({map:WOOD, roughness:0.72, metalness:0.04}),
      woodDark:  new THREE.MeshStandardMaterial({map:WOOD, roughness:0.72, metalness:0.04, color:0x998878}),
      tile:      new THREE.MeshStandardMaterial({map:TILE, roughness:0.45, metalness:0.08}),
      kitFloor:  new THREE.MeshStandardMaterial({roughness:0.80, color:0xCDC8BE}),
      corridor:  new THREE.MeshStandardMaterial({roughness:0.82, color:0xC8C3B8}),
      entry:     new THREE.MeshStandardMaterial({roughness:0.80, color:0xD5D0C5}),
      balcony:   new THREE.MeshStandardMaterial({roughness:0.88, color:0xD0CBC2}),
      winFrame:  new THREE.MeshStandardMaterial({roughness:0.55, metalness:0.15, color:0x94a3b8}),
      glass:     new THREE.MeshStandardMaterial({color:0x93c5fd, roughness:0.04, metalness:0.1, transparent:true, opacity:0.50}),
      doorFrame: new THREE.MeshStandardMaterial({roughness:0.65, color:0x64748b}),
      doorLeaf:  new THREE.MeshStandardMaterial({roughness:0.65, color:0x475569}),
      sofa:      new THREE.MeshStandardMaterial({roughness:0.88, color:0x3b82f6}),  // app primary
      sofaLight: new THREE.MeshStandardMaterial({roughness:0.88, color:0x93c5fd}),
      bed:       new THREE.MeshStandardMaterial({roughness:0.88, color:0xE8E4DC}),
      bedSheet:  new THREE.MeshStandardMaterial({roughness:0.88, color:0xdbeafe}),  // blue-100
      pillow:    new THREE.MeshStandardMaterial({roughness:0.90, color:0xeff6ff}),
      table:     new THREE.MeshStandardMaterial({roughness:0.72, color:0xC5BEB0}),
      chair:     new THREE.MeshStandardMaterial({roughness:0.85, color:0xB8B4AE}),
      rug:       new THREE.MeshStandardMaterial({roughness:0.97, color:0xbfdbfe}),  // blue-200
      kitTop:    new THREE.MeshStandardMaterial({roughness:0.55, metalness:0.1, color:0xE8E5DE}),
      kitBase:   new THREE.MeshStandardMaterial({roughness:0.80, color:0x475569}),
      toilet:    new THREE.MeshStandardMaterial({roughness:0.55, color:0xF0EEEA}),
      tub:       new THREE.MeshStandardMaterial({roughness:0.45, metalness:0.05, color:0xF0EEEA}),
      plant:     new THREE.MeshStandardMaterial({roughness:0.90, color:0x3D6A2E}),
      pot:       new THREE.MeshStandardMaterial({roughness:0.80, color:0x9A7055}),
      railing:   new THREE.MeshStandardMaterial({roughness:0.55, metalness:0.2, color:0x94a3b8}),
      stair:     new THREE.MeshStandardMaterial({roughness:0.90, color:0x64748b}),
      lift:      new THREE.MeshStandardMaterial({roughness:0.80, metalness:0.25, color:0x1e40af}),  // blue-800
      slab:      new THREE.MeshStandardMaterial({roughness:0.92, color:0xcbd5e1}),
    }

    const B = (w:number,h:number,d:number, mat:THREE.Material, x:number,y:number,z:number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat)
      m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m
    }
    const CYL = (rt:number,rb:number,h:number, mat:THREE.Material, x:number,y:number,z:number) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,10), mat)
      m.position.set(x,y,z); m.castShadow=true; return m
    }

    // Ground slab
    const gs = B(FW,0.20,TD, M.slab, ox+FW/2,-0.10,oz+TD/2); gs.userData.floor=-1; t.buildingGrp.add(gs)

    for (let fl=0; fl<floors; fl++) {
      const Y0=fl*FloorH, wy=Y0+WallH/2
      const addF = (mesh: THREE.Mesh) => { mesh.userData.floor=fl; mesh.userData.baseY=mesh.position.y; t.buildingGrp!.add(mesh); return mesh }

      if (fl>0) addF(B(FW,ST,TD, M.slab, ox+FW/2, Y0-ST/2, oz+TD/2))
      addF(B(TW-WT*2,0.02,cw-WT*2, M.corridor, ox+TW/2, Y0+0.01, oz+ad+cw/2))
      addF(B(TW+WT*2,WallH,WT, M.wall, ox+TW/2,wy,oz))
      const bw=B(TW+WT*2,WallH,WT, M.wall, ox+TW/2,wy,oz+TD); bw.userData.isBackWall=fl; bw.userData.floor=fl; bw.userData.baseY=bw.position.y; t.buildingGrp.add(bw)
      addF(B(WT,WallH,ad+WT, M.wall, ox,wy,oz+(ad+WT)/2))
      const wc=B(WT,WallH,cw, M.wall, ox,wy,oz+ad+cw/2); wc.userData.isWestCorr=fl; wc.userData.floor=fl; wc.userData.baseZ=wc.position.z; t.buildingGrp.add(wc)
      addF(B(WT,WallH,ad+WT, M.wall, ox,wy,oz+ad+cw+(ad+WT)/2))
      addF(B(WT,WallH,TD+WT*2, M.wall, ox+TW,wy,oz+TD/2))
      addF(B(TW-WT,WallH,WT, M.wallDark, ox+TW/2+WT/2,wy,oz+ad))
      addF(B(TW-WT,WallH,WT, M.wallDark, ox+TW/2+WT/2,wy,oz+ad+cw))

      for (let i=1; i<apts; i++) {
        const xd=ox+i*aw
        addF(B(WT,WallH,ad-WT, M.wall, xd,wy,oz+ad/2+WT/2))
        addF(B(WT,WallH,ad-WT, M.wall, xd,wy,oz+ad+cw+ad/2-WT/2))
      }

      for (let i=0; i<apts; i++) {
        const ax0=ox+i*aw
        const prev=t.buildingGrp.children.length
        buildApt(t.buildingGrp, ax0, oz,      aw,ad,WallH,WT,'top',   i,Y0,B,CYL,M)
        buildApt(t.buildingGrp, ax0, oz+ad+cw,aw,ad,WallH,WT,'bottom',i,Y0,B,CYL,M)
        for (let k=prev; k<t.buildingGrp.children.length; k++) {
          const m = t.buildingGrp.children[k] as THREE.Mesh
          if (m.userData.floor===undefined){m.userData.floor=fl;m.userData.baseY=m.position.y}
        }
        const h1=B(aw-WT,0.1,ad-WT, new THREE.MeshBasicMaterial({visible:false}), ax0+aw/2,Y0+0.05,oz+ad/2)
        h1.userData={label:`Apt ${fl+1}${(i+1).toString().padStart(2,'0')}`,floor:fl+1,side:'North',area:Math.round(aw*ad),floorIdx:fl}
        t.buildingGrp.add(h1); t.hitMeshes.push(h1)
        const h2=B(aw-WT,0.1,ad-WT, new THREE.MeshBasicMaterial({visible:false}), ax0+aw/2,Y0+0.05,oz+ad+cw+ad/2)
        h2.userData={label:`Apt ${fl+1}${(apts+i+1).toString().padStart(2,'0')}`,floor:fl+1,side:'South',area:Math.round(aw*ad),floorIdx:fl}
        t.buildingGrp.add(h2); t.hitMeshes.push(h2)
      }

      const ss=t.buildingGrp.children.length
      buildStair(t.buildingGrp,ox+TW,oz,STW,TD,WallH,WT,Y0,B,M)
      for (let k=ss; k<t.buildingGrp.children.length; k++){
        const m=t.buildingGrp.children[k] as THREE.Mesh
        if(m.userData.floor===undefined){m.userData.floor=fl;m.userData.baseY=m.position.y}
      }
    }

    t.scene.add(t.buildingGrp)
    t.drawerOffset = Array(floors).fill(0)
    t.drawerTarget = Array(floors).fill(0)

    applyViewInternal(t, cfg, t.viewMode)
    triggerDrawer(t, cfg)
    setFloorInfo(`Floor ${t.currentFloorWalk+1} of ${floors}`)
  }, [cfg])

  useEffect(() => { build() }, [build])

  /* ═══════════════════════════════════════════════════════
     VIEW
  ═══════════════════════════════════════════════════════ */
  const applyViewInternal = (t: NonNullable<typeof threeRef.current>, c: Cfg, v: ViewMode) => {
    if (!t.buildingGrp) return
    const { floors, apts, aw, ad, cw } = c
    const WT=0.28,ST=0.18,STW=3.8,WallH=3.2,FloorH=WallH+ST
    const TW=apts*aw,TD=ad*2+cw,FW=TW+STW,ox=-FW/2,oz=-TD/2
    const totalH=floors*FloorH,cx=ox+FW/2,cz=oz+TD/2

    updateWallVisibility(t, v)

    if (v==='top') {
      t.controls.maxPolarAngle=0.001; t.controls.enableRotate=false
      const maxDim=Math.max(FW,TD,totalH)
      t.controls.target.set(cx,0,cz)
      t.camera.position.set(cx,maxDim*1.2,cz+0.001)
      t.controls.update()
    } else if (v==='iso') {
      t.controls.maxPolarAngle=Math.PI*0.90; t.controls.enableRotate=false
      const dist=Math.max(FW,TD)*0.97
      t.controls.target.set(cx,totalH*0.35,cz)
      t.camera.position.set(cx-dist*0.15,totalH+dist*0.95,cz+dist*0.55)
      t.controls.update()
    } else if (v==='corridor') {
      t.controls.enableRotate=false
      const flY=t.currentFloorWalk*FloorH+WallH*0.5
      const maxDim=Math.max(FW,TD,totalH)
      const wDist=(maxDim*1.2)/1.07
      t.controls.target.set(cx,flY,oz+TD/2)
      t.camera.position.set(cx+(-0.85/1.0)*wDist,flY+(0.52/1.0)*wDist,oz+TD/2)
      t.controls.update()
    } else {
      t.controls.enableRotate=true; t.controls.maxPolarAngle=Math.PI*0.90
      const dist=Math.max(FW,TD,totalH)*1.1
      t.controls.target.set(cx,totalH*0.3,cz)
      t.camera.position.set(cx+dist*0.5,totalH+dist*0.6,cz+dist*0.7)
      t.controls.update()
    }
  }

  const updateWallVisibility = (t: NonNullable<typeof threeRef.current>, v: ViewMode) => {
    if (!t.buildingGrp) return
    t.buildingGrp.traverse(m => {
      if (!(m as THREE.Mesh).isMesh) return
      const fl = m.userData.floor
      if (fl===undefined||fl<0) return
      if (!m.userData.matCloned) {
        const mesh = m as THREE.Mesh
        if (Array.isArray(mesh.material)) mesh.material=mesh.material.map(x=>x.clone())
        else if (mesh.material) mesh.material=(mesh.material as THREE.Material).clone()
        m.userData.matCloned=true
      }
      const isAbove=fl>t.currentFloorWalk
      const mats=Array.isArray((m as THREE.Mesh).material)?(m as THREE.Mesh).material as THREE.Material[]:[(m as THREE.Mesh).material as THREE.Material]
      mats.forEach(mat=>{
        if (!mat) return
        const sm=mat as THREE.MeshStandardMaterial
        sm.transparent=isAbove; sm.opacity=isAbove?0.15:1.0; sm.depthWrite=!isAbove; sm.needsUpdate=true
      })
      if (m.userData.isWestCorr!==undefined) m.visible=v==='corridor'?false:m.userData.isWestCorr!==t.currentFloorWalk
    })
  }

  const triggerDrawer = (t: NonNullable<typeof threeRef.current>, c: Cfg) => {
    const { floors, ad, cw } = c
    const TD=ad*2+cw, drawerGap=TD*1.05
    for (let fl=0;fl<floors;fl++) t.drawerTarget[fl]=fl>t.currentFloorWalk?drawerGap:0

    const step = () => {
      let moving=false
      for (let fl=0;fl<floors;fl++){
        const diff=t.drawerTarget[fl]-t.drawerOffset[fl]
        if (Math.abs(diff)>0.02){ t.drawerOffset[fl]+=diff*0.14; moving=true }
        else t.drawerOffset[fl]=t.drawerTarget[fl]
      }
      if (t.buildingGrp) {
        t.buildingGrp.traverse(m=>{
          if (!(m as THREE.Mesh).isMesh) return
          const fl=m.userData.floor; if(fl===undefined||fl<0) return
          if (m.userData.baseZ===undefined) m.userData.baseZ=m.position.z
          m.position.z=m.userData.baseZ-(t.drawerOffset[fl]||0)
        })
      }
      if (moving) requestAnimationFrame(step)
    }
    step()
  }

  const handleSetView = (v: ViewMode) => {
    const t = threeRef.current; if (!t) return
    t.viewMode=v; setViewMode(v)
    const labels:Record<ViewMode,string>={top:'Top-Down View',iso:'Isometric View',corridor:'Corridor Walk View',free:'Free Camera'}
    setViewLabel(labels[v])
    applyViewInternal(t, cfg, v)
    updateWallVisibility(t, v)
  }

  const handleFloorSelect = (i: number) => {
    const t = threeRef.current; if (!t) return
    t.currentFloorWalk=i; setCurrentFloor(i)
    setFloorInfo(`Floor ${i+1} of ${cfg.floors}`)
    triggerDrawer(t, cfg)
    applyViewInternal(t, cfg, t.viewMode)
  }

  /* ═══════════════════════════════════════════════════════
     MOUSE — tooltip
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const onMove = (e: MouseEvent) => {
      const t=threeRef.current; if(!t) return
      const r=canvas.getBoundingClientRect()
      const mp=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-(((e.clientY-r.top)/r.height)*2-1))
      const ray=new THREE.Raycaster()
      ray.setFromCamera(mp,t.camera)
      const hits=ray.intersectObjects(t.hitMeshes)
      if (hits.length) {
        const ud=hits[0].object.userData
        setTooltip({x:e.clientX-r.left+14,y:e.clientY-r.top-10,html:`<strong>${ud.label}</strong>Floor ${ud.floor} · ${ud.side}<br>Area: ${ud.area} m²`})
        canvas.style.cursor='pointer'
      } else { setTooltip(null); canvas.style.cursor='default' }
    }
    canvas.addEventListener('mousemove',onMove)
    canvas.addEventListener('mouseleave',()=>setTooltip(null))
    return ()=>{ canvas.removeEventListener('mousemove',onMove) }
  }, [])

  /* ── Slider helper ── */
  const slide = (key: keyof Cfg, val: string) =>
    setCfg(prev => ({ ...prev, [key]: parseFloat(val) }))

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm" style={{minHeight:500}}>

      {/* ── Sidebar — hidden in viewOnly mode ── */}
      <div className={`w-56 shrink-0 flex flex-col gap-3 border-r border-border/50 p-4 overflow-y-auto bg-white${viewOnly ? ' hidden' : ''}`}>

        <p className="text-xs font-bold text-foreground border-b border-border/50 pb-2">3D Floor Viewer</p>

        {/* Building sliders */}
        <Section label="BUILDING">
          <Slider label="Floors"        value={cfg.floors} min={1} max={10} step={1}   onChange={v=>slide('floors',v)} />
          <Slider label="Apts / side"   value={cfg.apts}   min={1} max={5}  step={1}   onChange={v=>slide('apts',v)} />
        </Section>

        <hr className="border-border/40" />

        <Section label="APARTMENT (m)">
          <Slider label="Width"    value={cfg.aw} min={5}   max={14} step={0.5} onChange={v=>slide('aw',v)} suffix="m" />
          <Slider label="Depth"    value={cfg.ad} min={6}   max={16} step={0.5} onChange={v=>slide('ad',v)} suffix="m" />
          <Slider label="Corridor" value={cfg.cw} min={1.5} max={4}  step={0.1} onChange={v=>slide('cw',v)} suffix="m" />
        </Section>

        <hr className="border-border/40" />

        {/* Camera view */}
        <Section label="CAMERA VIEW">
          <div className="grid grid-cols-2 gap-1">
            {(['top','iso','corridor','free'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => handleSetView(v)}
                className={`py-1.5 text-[10px] font-medium rounded-md border transition-colors ${
                  viewMode===v
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {v==='top'?'⬆ Top':v==='iso'?'◈ Iso':v==='corridor'?'🚶 Walk':'✥ Free'}
              </button>
            ))}
          </div>
        </Section>

        <hr className="border-border/40" />

        {/* Floors */}
        <Section label="FLOORS">
          <div className="flex flex-wrap gap-1">
            {Array.from({length:cfg.floors},(_,i)=>(
              <button
                key={i}
                onClick={() => handleFloorSelect(i)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded border transition-colors ${
                  i===currentFloor
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                F{i+1}
              </button>
            ))}
          </div>
        </Section>

        {/* Stats */}
        <div className="mt-auto pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
          {[
            { val: stats.unitsPerFloor, lbl: 'Units/floor' },
            { val: stats.areaEach,      lbl: 'm² each'     },
            { val: stats.totalUnits,    lbl: 'Total units'  },
            { val: stats.footprint,     lbl: 'Footprint m²' },
          ].map(s => (
            <div key={s.lbl} className="rounded-lg bg-muted/40 p-2">
              <p className="text-sm font-bold" style={{color:PRIMARY_HX}}>{s.val}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div ref={wrapRef} className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full" />

        {/* ── Top-left: label (viewOnly) or floor info (full) ── */}
        {viewOnly && label && (
          <div className="absolute top-3 left-3 rounded-md bg-white/90 border border-border/60 px-3 py-1 text-xs font-semibold pointer-events-none shadow-sm text-foreground">
            {label}
          </div>
        )}
        {!viewOnly && (
          <div className="absolute top-3 left-3 rounded-md bg-white/90 border border-border/60 px-3 py-1 text-xs font-semibold pointer-events-none shadow-sm" style={{color:PRIMARY_HX}}>
            {floorInfo}
          </div>
        )}

        {/* ── Top-right: view label (full mode only) ── */}
        {!viewOnly && (
          <div className="absolute top-3 right-3 rounded-md bg-white/90 border border-border/60 px-3 py-1 text-xs text-muted-foreground pointer-events-none shadow-sm">
            {viewLabel}
          </div>
        )}

        {/* ── Floating controls overlay (viewOnly + showControls) ── */}
        {viewOnly && showControls && (
          <>
            {/* Camera view — bottom-left */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
              <p className="text-[9px] font-bold tracking-widest text-muted-foreground/70 uppercase px-0.5">View</p>
              <div className="flex gap-1">
                {(['top','iso','corridor','free'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => handleSetView(v)}
                    className={`px-2 py-1 text-[10px] font-medium rounded-md border shadow-sm transition-colors backdrop-blur-sm ${
                      viewMode === v
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white/90 text-muted-foreground border-border/70 hover:bg-white hover:text-foreground'
                    }`}
                  >
                    {v === 'top' ? '⬆ Top' : v === 'iso' ? '◈ Iso' : v === 'corridor' ? '🚶 Walk' : '✥ Free'}
                  </button>
                ))}
              </div>
            </div>

            {/* Floor selector — bottom-right */}
            <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
              <p className="text-[9px] font-bold tracking-widest text-muted-foreground/70 uppercase px-0.5">Floor</p>
              <div className="flex flex-wrap-reverse justify-end gap-1 max-w-[160px]">
                {Array.from({ length: cfg.floors }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleFloorSelect(i)}
                    className={`w-8 h-7 text-[10px] font-semibold rounded-md border shadow-sm transition-colors backdrop-blur-sm ${
                      i === currentFloor
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white/90 text-muted-foreground border-border/70 hover:bg-white hover:text-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Zoom badge (full mode) ── */}
        {!viewOnly && (
          <div className="absolute bottom-9 right-3 rounded-md bg-white/90 border border-border/60 px-3 py-1 text-xs font-bold pointer-events-none shadow-sm" style={{color:PRIMARY_HX}}>
            Zoom: {zoom}%
          </div>
        )}

        {/* ── Hint ── */}
        {!viewOnly && (
          <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/60 text-right pointer-events-none leading-relaxed">
            Drag to orbit · Scroll to zoom
          </div>
        )}

        {/* ── Tooltip ── */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-50 rounded-lg border border-primary/40 bg-white/95 shadow-md px-3 py-2 text-xs leading-relaxed"
            style={{left:tooltip.x, top:tooltip.y}}
            dangerouslySetInnerHTML={{__html:tooltip.html}}
          />
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase">{label}</p>
      {children}
    </div>
  )
}

function Slider({ label, value, min, max, step, suffix='', onChange }:
  { label:string; value:number; min:number; max:number; step:number; suffix?:string; onChange:(v:string)=>void }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-1 rounded cursor-pointer accent-primary"
      />
    </div>
  )
}

/* ── Three.js helpers (outside component) ────────────────── */

function buildApt(
  grp: THREE.Group, ax:number, az:number, aw:number, ad:number,
  WH:number, WT:number, side:string, _idx:number, Y0:number,
  B: (w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number)=>THREE.Mesh,
  CYL: (rt:number,rb:number,h:number,mat:THREE.Material,x:number,y:number,z:number)=>THREE.Mesh,
  M: Record<string, THREE.MeshStandardMaterial>
) {
  const isTop=side==='top', cx=ax+aw/2, cz=az+ad/2, y=Y0
  const bedW=aw*0.44,bedD=ad*0.50,bthW=aw*0.30,bthD=ad*0.35,kitW=aw*0.38,kitD=ad*0.20
  const bedX=ax+aw-bedW/2, bedZ=isTop?az+bedD/2:az+ad-bedD/2
  const bthX=ax+bthW/2,    bthZ=isTop?az+ad-bthD/2:az+bthD/2
  const kitX=ax+bthW+kitW/2, kitZ=isTop?az+kitD/2:az+ad-kitD/2

  grp.add(B(aw-WT,0.02,ad-WT, M.wood, cx,y+0.01,cz))
  grp.add(B(bedW-WT,0.025,bedD-WT, M.woodDark, bedX,y+0.012,bedZ))
  grp.add(B(bthW-WT,0.025,bthD-WT, M.tile,     bthX,y+0.012,bthZ))
  grp.add(B(kitW-WT,0.025,kitD-WT, M.kitFloor, kitX,y+0.012,kitZ))
  const entW=aw*0.18,entD=ad*0.10
  grp.add(B(entW,0.022,entD, M.entry, cx,y+0.011,isTop?az+ad-entD/2-WT:az+entD/2+WT))
  grp.add(B(WT,WH,bedD, M.wall, ax+aw-bedW,y+WH/2,bedZ))
  grp.add(B(bedW+WT,WT,WT, M.wall, bedX-WT/2,y+WH-WT/2,isTop?az+bedD:az+ad-bedD))
  grp.add(B(WT,WH,bthD, M.wallDark, ax+bthW,y+WH/2,bthZ))
  grp.add(B(bthW+WT,WT,WT, M.wallDark, bthX-WT/2,y+WH-WT/2,isTop?az+ad-bthD:az+bthD))
  const clsW=aw*0.20,clsD=ad*0.18,clsX=ax+clsW/2
  const clsZ=isTop?az+ad-bthD-clsD/2:az+bthD+clsD/2
  grp.add(B(WT,WH*0.90,clsD, M.wallDark, ax+clsW,y+WH*0.45,clsZ))
  grp.add(B(clsW+WT,WT,WT, M.wallDark, clsX-WT/2,y+WH*0.90-WT/2,isTop?clsZ+clsD/2:clsZ-clsD/2))
  const winZ=isTop?az:az+ad, nWin=Math.max(1,Math.floor((aw-WT*2)/3.5))
  const wW=Math.min(1.5,(aw-WT*2)/nWin*0.60)
  for (let w=0;w<nWin;w++){
    const spacing=(aw-WT*2-nWin*wW)/(nWin+1),wx=ax+WT+spacing+w*(wW+spacing)+wW/2
    grp.add(B(wW,1.25,WT+0.06, M.winFrame, wx,y+1.05,winZ))
    grp.add(B(wW-0.1,1.08,0.06, M.glass, wx,y+1.08,winZ))
    grp.add(B(wW+0.2,0.06,0.20, M.wallDark, wx,y+0.41,isTop?winZ-0.08:winZ+0.08))
  }
  const dW=0.92,dH=2.10,dZ=isTop?az+ad:az
  grp.add(B(dW+0.14,dH+0.12,WT+0.06, M.wall, cx,y+dH/2+0.06,dZ))
  grp.add(B(dW,dH,WT+0.08, M.doorFrame, cx,y+dH/2,dZ))
  grp.add(B(dW-0.04,dH-0.08,0.05, M.doorLeaf, cx-dW*0.15,y+dH/2,dZ+(isTop?0.12:-0.12)))
  const balW=aw*0.48,balD=1.4,balZ=isTop?az-balD/2:az+ad+balD/2
  grp.add(B(balW,0.12,balD, M.balcony, cx,y+0.06,balZ))
  grp.add(B(balW,0.055,0.05, M.railing, cx,y+1.02,isTop?balZ-balD/2+0.025:balZ+balD/2-0.025))
  grp.add(B(0.05,1.0,balD, M.railing, cx-balW/2+0.025,y+0.56,balZ))
  grp.add(B(0.05,1.0,balD, M.railing, cx+balW/2-0.025,y+0.56,balZ))
  const nPost=Math.ceil(balW/0.9)
  for(let p=1;p<nPost;p++) grp.add(B(0.04,1.0,0.04, M.railing, cx-balW/2+p*(balW/nPost),y+0.56,balZ))
  const bfX=bedX,bfZ=isTop?bedZ+bedD*0.1:bedZ-bedD*0.1
  grp.add(B(bedW*0.70,0.28,bedD*0.58, M.bed, bfX,y+0.14,bfZ))
  grp.add(B(bedW*0.70,0.08,bedD*0.58, M.bedSheet, bfX,y+0.30,bfZ))
  grp.add(B(bedW*0.28,0.08,bedD*0.13, M.pillow, bfX-bedW*0.18,y+0.32,isTop?bfZ-bedD*0.20:bfZ+bedD*0.20))
  grp.add(B(bedW*0.28,0.08,bedD*0.13, M.pillow, bfX+bedW*0.18,y+0.32,isTop?bfZ-bedD*0.20:bfZ+bedD*0.20))
  grp.add(B(0.45,0.48,0.45, M.table, bfX-bedW*0.37,y+0.24,bfZ))
  grp.add(B(0.45,0.48,0.45, M.table, bfX+bedW*0.37,y+0.24,bfZ))
  const livW=aw-bthW-bedW-WT*3
  const sfX=ax+bthW+livW*0.55,sfZ=isTop?az+ad*0.65:az+ad-ad*0.65
  const sfW=livW*0.90,sfD=aw*0.18
  grp.add(B(sfW,0.42,sfD, M.sofa, sfX,y+0.21,sfZ))
  grp.add(B(sfW,0.55,0.12, M.sofa, sfX,y+0.275,isTop?sfZ+sfD/2:sfZ-sfD/2))
  grp.add(B(0.12,0.55,sfD, M.sofa, sfX-sfW/2+0.06,y+0.275,sfZ))
  grp.add(B(0.12,0.55,sfD, M.sofa, sfX+sfW/2-0.06,y+0.275,sfZ))
  grp.add(B(sfW*0.44,0.10,sfD*0.85, M.sofaLight, sfX-sfW*0.24,y+0.47,sfZ))
  grp.add(B(sfW*0.44,0.10,sfD*0.85, M.sofaLight, sfX+sfW*0.24,y+0.47,sfZ))
  grp.add(B(sfW*0.54,0.06,sfD*1.1, M.table, sfX,y+0.30,isTop?sfZ-sfD*1.2:sfZ+sfD*1.2))
  grp.add(B(sfW+1.0,0.016,sfD*3.2, M.rug, sfX,y+0.016,sfZ))
  const dtX=ax+bthW+livW*0.45,dtZ=isTop?az+ad*0.25:az+ad-ad*0.25
  grp.add(B(1.3,0.08,0.8, M.table, dtX,y+0.38,dtZ))
  ;[[dtX-0.68,dtZ],[dtX+0.68,dtZ],[dtX,dtZ-0.5],[dtX,dtZ+0.5]].forEach(([cx2,cz2])=>{
    grp.add(B(0.42,0.06,0.42, M.chair, cx2,y+0.22,cz2))
  })
  const kcZ=isTop?az+0.30:az+ad-0.30
  grp.add(B(kitW-0.1,0.90,0.58, M.kitBase, kitX,y+0.45,kcZ))
  grp.add(B(kitW-0.1,0.06,0.62, M.kitTop,  kitX,y+0.93,kcZ))
  const ksX=ax+bthW+0.30
  grp.add(B(0.58,0.90,kitD-0.1, M.kitBase, ksX,y+0.45,kitZ))
  grp.add(B(0.62,0.06,kitD-0.1, M.kitTop,  ksX,y+0.93,kitZ))
  grp.add(B(0.40,0.45,0.55, M.toilet, ax+0.22,y+0.225,isTop?az+ad-bthD*0.22:az+bthD*0.22))
  grp.add(B(bthW*0.62,0.48,bthD*0.42, M.tub, bthX+0.05,y+0.24,isTop?az+ad-bthD*0.70:az+bthD*0.70))
  grp.add(CYL(0.14,0.18,0.32, M.pot, ax+bthW+0.22,y+0.16,isTop?az+ad*0.88:az+ad*0.12))
  grp.add(CYL(0.22,0.14,0.40, M.plant, ax+bthW+0.22,y+0.56,isTop?az+ad*0.88:az+ad*0.12))
}

function buildStair(
  grp: THREE.Group, sx:number, sz:number, sw:number, sd:number,
  WH:number, WT:number, Y0:number,
  B: (w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number)=>THREE.Mesh,
  M: Record<string, THREE.MeshStandardMaterial>
) {
  grp.add(B(WT,WH,sd+WT*2, M.wall, sx,Y0+WH/2,sz+sd/2))
  grp.add(B(WT,WH,sd+WT*2, M.wall, sx+sw,Y0+WH/2,sz+sd/2))
  grp.add(B(sw+WT*2,WH,WT, M.wall, sx+sw/2,Y0+WH/2,sz))
  grp.add(B(sw+WT*2,WH,WT, M.wall, sx+sw/2,Y0+WH/2,sz+sd))
  grp.add(B(sw-WT*2,0.02,sd*0.52-0.2, M.stair, sx+sw/2,Y0+0.01,sz+sd*0.26))
  const nS=13,sH=WH/nS,sD=(sd*0.52-0.4)/nS
  for(let s=0;s<nS;s++) grp.add(B(sw-WT*2-0.1,sH,sD+0.05, M.stair, sx+sw/2,Y0+sH*s+sH/2,sz+0.2+s*sD))
  grp.add(B(0.04,WH*0.65,0.04, M.railing, sx+sw/2+0.3,Y0+WH*0.325,sz+sd*0.26))
  const lZ=sz+sd*0.52+0.1,lH=sd*0.48-0.2
  grp.add(B(sw-WT*2,WH-0.1,lH, M.lift, sx+sw/2,Y0+(WH-0.1)/2,lZ+lH/2))
  grp.add(B(sw*0.5,WH*0.72,0.05, M.winFrame, sx+sw/2,Y0+WH*0.36,sz+sd*0.52))
}
