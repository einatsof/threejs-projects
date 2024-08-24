var camera, scene, renderer, controls;

init();
animate();

function init() {

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0xffffff, 1 );
	let canvas = renderer.domElement;
	document.body.appendChild( canvas );
	const aspect = window.innerWidth / window.innerHeight;

	camera = new THREE.PerspectiveCamera( 50, aspect, 0.01, 30000 );
  camera.position.set( 3, 3 ,4 );

	scene = new THREE.Scene();		
	scene.add( camera );

	controls = new THREE.OrbitControls( camera, canvas );
				
	var upoints = []; // positions of control points for the uniform
  var controlPoints = [];
  var dragControls = new THREE.DragControls( controlPoints, camera, canvas );
  dragControls.addEventListener( "dragstart", function( event ) {
    controls.enabled = false;
  });
  dragControls.addEventListener( "dragend", function( event ) {
    controls.enabled = true;
  });
                
  // create control points
  createControlPoint( -1, -1, -1, "aqua", controlPoints, upoints );
  createControlPoint(  1, -1, -1, "aqua", controlPoints, upoints );
  createControlPoint( -1,  1, -1, "aqua", controlPoints, upoints );
  createControlPoint(  1,  1, -1, "aqua", controlPoints, upoints );
  createControlPoint( -1, -1,  1, "aqua", controlPoints, upoints );
  createControlPoint(  1, -1,  1, "aqua", controlPoints, upoints );
  createControlPoint( -1,  1,  1, "aqua", controlPoints, upoints );
  createControlPoint(  1,  1,  1, "aqua", controlPoints, upoints );
				
  // box base points
  let basePts1 = [
    [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1],
    [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]
  ].map(p => {return new THREE.Vector3( p[0], p[1], p[2] )});
  let pts1 = [];
  for(let i = 0; i < 4; i++){
    // bottom
    pts1.push(basePts1[i].clone());
    pts1.push(basePts1[(i + 1) > 3 ? 0 : (i + 1)].clone());
    // top
    pts1.push(basePts1[4 + i].clone());
    pts1.push(basePts1[(4 + i + 1) > 7 ? 4 : (4 + i + 1)].clone());
    // middle
    pts1.push(basePts1[i].clone());
    pts1.push(basePts1[i + 4].clone());
  }
  
  let lineGeometry = new THREE.BufferGeometry().setFromPoints( pts1 );

  let boxGeometry = new THREE.BoxGeometry( 1, 1, 1 ).toNonIndexed();
  boxGeometry.translate( 0.5, 0.5, 0.5 );
                
  // materials
  let fullCubeMaterial = new THREE.MeshBasicMaterial( { color: 0xcccccc, transparent: false, opacity: 1, side: THREE.DoubleSide, depthTest: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 } );
  let dashMaterial = new THREE.LineDashedMaterial( { color: 0x888888, dashSize: 0.1, gapSize: 0.03, depthTest: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1  } );
  let solidMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, depthTest: true, polygonOffset: true, depthWrite: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 } );

  // additional vertex shader code
  vShader = [
    "#include <begin_vertex>",
    "vec3 farBottomX = (upoints[1] - upoints[0]) * position.x + upoints[0];",
    "vec3 farTopX = (upoints[3] - upoints[2]) * position.x + upoints[2];",
    "vec3 nearBottomX = (upoints[5] - upoints[4]) * position.x + upoints[4];",
    "vec3 nearTopX = (upoints[7] - upoints[6]) * position.x + upoints[6];",
    "vec3 farY = (farTopX - farBottomX) * position.y + farBottomX;",
    "vec3 nearY = (nearTopX - nearBottomX) * position.y + nearBottomX;",
    "transformed = (nearY - farY) * position.z + farY;",
    ""
  ].join("\n");
  
  fullCubeMaterial.onBeforeCompile = shader => {
    shader.uniforms.upoints = {value: upoints};
    shader.vertexShader = "\nuniform vec3 upoints[8];\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      vShader
    );
  }

  dashMaterial.onBeforeCompile = shader => {
    shader.uniforms.upoints = {value: upoints};
    shader.vertexShader = "\nuniform vec3 upoints[8];\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      vShader
    );
  }

  solidMaterial.onBeforeCompile = shader => {
    shader.uniforms.upoints = {value: upoints};
    shader.vertexShader = "\nuniform vec3 upoints[8];\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      vShader
    );
  }

  let fullCube = new THREE.Mesh( boxGeometry , fullCubeMaterial );
  scene.add( fullCube );
  let dashedLine = new THREE.LineSegments( lineGeometry.clone(), dashMaterial );
  dashedLine.computeLineDistances();
  scene.add( dashedLine );
  let solidLine = new THREE.LineSegments( lineGeometry.clone(), solidMaterial );
  scene.add( solidLine );

  window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  render();
}
            
function animate() {
  requestAnimationFrame( animate );
  controls.update();
  render();
}
			
function render() {
  renderer.render( scene, camera );
}
						
function createControlPoint(posX, posY, posZ, color, controlPoints, upoints) {
  let dim = 0.1;
  let pointGeometry = new THREE.BoxGeometry( dim, dim, dim );
  let pointMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
    polygonOffset: false
  });
  let controlPoint = new THREE.Mesh( pointGeometry, pointMaterial );
  controlPoint.position.set( posX, posY, posZ );
  controlPoints.push( controlPoint );
  upoints.push( controlPoint.position );
  scene.add( controlPoint );
}