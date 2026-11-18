import * as THREE from 'three';
import type { Theme,Track } from './types';

const COLORS:Record<Theme,[string,string,string]>={
  space:['#160e38','#10244f','#7169ff'],
  ocean:['#052e43','#031a34','#35d5f1'],
  forest:['#082c29','#0a1e29','#74e3b0'],
  city:['#29123d','#0b1538','#ff58b7'],
};

export class SoundStage {
  private renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();
  private camera:THREE.PerspectiveCamera;
  private clock=new THREE.Clock();
  private orb:THREE.Mesh;
  private rings:THREE.Mesh[]=[];
  private bars:THREE.Mesh[]=[];
  private satellites:THREE.Mesh[]=[];
  private clickable=new Map<THREE.Object3D,string>();
  private raycaster=new THREE.Raycaster();
  private pointer=new THREE.Vector2();
  private currentTheme:Theme='space';
  private backdrop:THREE.Mesh;
  private picture:THREE.Mesh|null=null;
  private activeTexture:THREE.Texture|null=null;
  private activeVideo:HTMLVideoElement|null=null;
  private activeURL:string|null=null;
  private stars:THREE.Points;
  private mouse={x:0,y:0};
  private onTrackClick:(id:string)=>void;
  private onHover:(name:string|null)=>void;
  private analyser:()=>Uint8Array;

  constructor(private host:HTMLElement,analyser:()=>Uint8Array,onTrackClick:(id:string)=>void,onHover:(name:string|null)=>void){
    this.analyser=analyser;this.onTrackClick=onTrackClick;this.onHover=onHover;
    this.scene.background=new THREE.Color('#070c1c');
    this.camera=new THREE.PerspectiveCamera(44,16/9,0.1,100);
    this.camera.position.set(0,1.5,13);this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.3;
    this.renderer.domElement.id='three-canvas';this.renderer.domElement.setAttribute('aria-label','可點選浮動光球開關音軌的 3D 互動舞台');
    this.host.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.AmbientLight('#c6d7ff',0.9));
    const light=new THREE.PointLight('#8a6cff',75,35);light.position.set(2,4,6);this.scene.add(light);
    const blue=new THREE.PointLight('#38e5ef',45,22);blue.position.set(-5,-2,3);this.scene.add(blue);

    const backMat=new THREE.ShaderMaterial({
      uniforms:{time:{value:0},c1:{value:new THREE.Color(COLORS.space[0])},c2:{value:new THREE.Color(COLORS.space[1])},accent:{value:new THREE.Color(COLORS.space[2])}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float time;uniform vec3 c1;uniform vec3 c2;uniform vec3 accent;
      void main(){vec2 uv=vUv;float glow=0.22/(length((uv-vec2(.52+.06*sin(time*.12),.55))*vec2(1.25,1.))+0.24);
      float wave=.09*sin(uv.x*8.+time*.25)*sin(uv.y*6.-time*.18);
      vec3 col=mix(c1,c2,smoothstep(0.,1.,uv.y*.95+uv.x*.12));col+=accent*(glow*.55+wave*.15);
      gl_FragColor=vec4(col,1.);}`,
      depthWrite:false
    });
    this.backdrop=new THREE.Mesh(new THREE.PlaneGeometry(32,19),backMat);this.backdrop.position.z=-13;this.scene.add(this.backdrop);

    const starGeom=new THREE.BufferGeometry(),dots=new Float32Array(170*3);
    for(let i=0;i<170;i++){dots[i*3]=(Math.random()-.5)*18;dots[i*3+1]=(Math.random()-.5)*10;dots[i*3+2]=-5-Math.random()*5;}
    starGeom.setAttribute('position',new THREE.BufferAttribute(dots,3));
    this.stars=new THREE.Points(starGeom,new THREE.PointsMaterial({color:'#a6dcff',size:0.042,transparent:true,opacity:0.76,depthWrite:false}));this.scene.add(this.stars);

    const orbGeo=new THREE.IcosahedronGeometry(1.45,5);
    this.orb=new THREE.Mesh(orbGeo,new THREE.MeshPhysicalMaterial({color:'#6d68f5',roughness:0.12,metalness:0.21,clearcoat:1,clearcoatRoughness:0.15,emissive:'#5144e2',emissiveIntensity:0.45,flatShading:true}));
    this.scene.add(this.orb);
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.35+i*.37,.015+i*.007,8,180),new THREE.MeshBasicMaterial({color:i===1?'#58e9f0':'#b3a4ff',transparent:true,opacity:0.56-i*.12}));
      ring.rotation.set(i*.45, i*.32, i*.65);this.rings.push(ring);this.scene.add(ring);
    }
    for(let i=0;i<64;i++){
      const angle=i/64*Math.PI*2;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.09,1,.09),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(i/64*.42+.51,.85,.66),transparent:true,opacity:.85}));
      bar.position.set(Math.cos(angle)*3.45,-1.3,Math.sin(angle)*3.45*.4);this.bars.push(bar);this.scene.add(bar);
    }
    this.renderer.domElement.addEventListener('pointermove',event=>this.pointerMove(event));
    this.renderer.domElement.addEventListener('click',event=>this.pointerClick(event));
    this.renderer.domElement.addEventListener('pointerleave',()=>this.onHover(null));
    new ResizeObserver(()=>this.resize()).observe(this.host);
    this.resize();this.animate();
  }
  get canvas():HTMLCanvasElement{return this.renderer.domElement;}
  setTheme(theme:Theme){
    this.currentTheme=theme;
    const [c1,c2,accent]=COLORS[theme];
    const material=this.backdrop.material as THREE.ShaderMaterial;
    material.uniforms.c1.value.set(c1);material.uniforms.c2.value.set(c2);material.uniforms.accent.value.set(accent);
    const o=this.orb.material as THREE.MeshPhysicalMaterial;
    o.color.set(accent);o.emissive.set(accent);
    (this.stars.material as THREE.PointsMaterial).color.set(theme==='forest'?'#9dffd0':'#b4dfff');
  }
  setTracks(tracks:Track[]){
    for(const m of this.satellites){this.scene.remove(m);m.geometry.dispose();(m.material as THREE.Material).dispose();}
    this.satellites=[];this.clickable.clear();
    const displayed=tracks.slice(0,9);
    displayed.forEach((t,i)=>{
      const angle=i/displayed.length*Math.PI*2+Math.PI/5;
      const geo=new THREE.IcosahedronGeometry(t.kind==='upload'?.34:.28,2);
      const mat=new THREE.MeshStandardMaterial({color:t.color,emissive:t.color,emissiveIntensity:t.enabled?.75:.12,metalness:.14,roughness:.24,transparent:true,opacity:t.enabled?1:.40});
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(Math.cos(angle)*4.75,Math.sin(angle)*2.72,1.2+Math.cos(angle*2)*.7);
      mesh.userData={name:t.name,id:t.id};this.scene.add(mesh);this.satellites.push(mesh);this.clickable.set(mesh,t.id);
    });
  }
  async setBackground(file:File):Promise<void>{
    if(this.picture){this.scene.remove(this.picture);this.picture.geometry.dispose();(this.picture.material as THREE.Material).dispose();this.picture=null;}
    if(this.activeTexture)this.activeTexture.dispose();
    if(this.activeVideo){this.activeVideo.pause();this.activeVideo.src='';this.activeVideo=null;}
    if(this.activeURL){URL.revokeObjectURL(this.activeURL);this.activeURL=null;}
    if(!file)return;
    this.activeURL=URL.createObjectURL(file);
    let texture:THREE.Texture;
    let dimensions:[number,number];
    if(file.type.startsWith('video/')){
      const vid=document.createElement('video');vid.src=this.activeURL;vid.muted=true;vid.loop=true;vid.playsInline=true;
      await new Promise<void>((resolve,reject)=>{vid.onloadeddata=()=>resolve();vid.onerror=()=>reject(new Error('影片載入失敗'));});
      this.activeVideo=vid;texture=new THREE.VideoTexture(vid);dimensions=[vid.videoWidth,vid.videoHeight];
      await vid.play();
    }else{
      const img=new Image();img.src=this.activeURL;
      await img.decode();texture=new THREE.Texture(img);texture.needsUpdate=true;dimensions=[img.naturalWidth,img.naturalHeight];
    }
    texture.colorSpace=THREE.SRGBColorSpace;
    // Cover the 16:9 viewport; trim sides/top without distorting source media.
    const aspect=dimensions[0]/dimensions[1],target=16/9;
    if(aspect>target){texture.repeat.set(target/aspect,1);texture.offset.set((1-target/aspect)/2,0);}
    else {texture.repeat.set(1,aspect/target);texture.offset.set(0,(1-aspect/target)/2);}
    this.activeTexture=texture;
    this.picture=new THREE.Mesh(new THREE.PlaneGeometry(42,23.625),new THREE.MeshBasicMaterial({map:texture,color:'#a0a8c9',toneMapped:false,side:THREE.DoubleSide}));
    this.picture.position.z=-11.5;this.scene.add(this.picture);
  }
  clearBackground(){
    if(this.picture){this.scene.remove(this.picture);this.picture.geometry.dispose();(this.picture.material as THREE.Material).dispose();this.picture=null;}
    this.activeTexture?.dispose();this.activeTexture=null;
    this.activeVideo?.pause();this.activeVideo=null;
    if(this.activeURL){URL.revokeObjectURL(this.activeURL);this.activeURL=null;}
  }
  rewindVideo(){if(this.activeVideo){this.activeVideo.currentTime=0;void this.activeVideo.play();}}
  private resize(){
    const width=this.host.clientWidth||700,height=this.host.clientHeight||394;
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);
  }
  private hit(event:PointerEvent|MouseEvent){
    const r=this.renderer.domElement.getBoundingClientRect();
    this.pointer.x=((event.clientX-r.left)/r.width)*2-1;
    this.pointer.y=-((event.clientY-r.top)/r.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hit=this.raycaster.intersectObjects(this.satellites,false)[0];
    return hit?hit.object:null;
  }
  private pointerMove(event:PointerEvent){
    const r=this.renderer.domElement.getBoundingClientRect();
    this.mouse.x=((event.clientX-r.left)/r.width-.5)*2;
    this.mouse.y=((event.clientY-r.top)/r.height-.5)*2;
    const hit=this.hit(event);
    this.renderer.domElement.style.cursor=hit?'pointer':'grab';
    this.onHover(hit?String(hit.userData.name):null);
  }
  private pointerClick(event:MouseEvent){const target=this.hit(event);if(target){const id=this.clickable.get(target);if(id)this.onTrackClick(id);}}
  private animate=()=>{
    requestAnimationFrame(this.animate);
    const time=this.clock.getElapsedTime(),levels=this.analyser();
    let sum=0;for(let i=0;i<Math.min(40,levels.length);i++)sum+=levels[i];
    const energy=sum/(40*255);
    this.orb.rotation.y+=.0024;this.orb.rotation.x+=.0009;
    const pulse=1+energy*.22+Math.sin(time*1.2)*.025;
    this.orb.scale.setScalar(pulse);
    this.rings.forEach((r,i)=>{r.rotation.z+=.0015*(i+1);r.rotation.y+=.0008*(i+1);r.scale.setScalar(1+energy*.09);});
    this.bars.forEach((bar,i)=>{
      const amp=levels[(i*2)%levels.length]/255;
      const height=.12+amp*2.15+Math.sin(time*1.8+i*.45)*.035;
      bar.scale.y=Math.max(.05,height);bar.position.y=-1.45+Math.max(.05,height)/2;
    });
    this.satellites.forEach((s,i)=>{s.rotation.x+=.006;s.rotation.y+=.009;s.position.y+=Math.sin(time*1.2+i)*.0017;});
    (this.backdrop.material as THREE.ShaderMaterial).uniforms.time.value=time;
    this.stars.rotation.y=time*.008;
    this.camera.position.x+=(this.mouse.x*.33-this.camera.position.x)*.018;
    this.camera.position.y+=(1.5-this.mouse.y*.24-this.camera.position.y)*.018;
    this.camera.lookAt(0,0,0);
    this.renderer.render(this.scene,this.camera);
  };
}
