// var lastTimer = 0
// var deltaTime = 0
// var rotationSpeed = 500
// var rotationQueue = []
var rank = 3
var cubeSize = 1
var scene
var camera
var controls
var renderer
var cubeGroup
var selectedArrow
var selectedCude
var isOnCube = false

var faces = {
  up: {
    name: 'yellow',
    color: '#FDCC09',
    texture: getFaceTexture('#FDCC09'),
  },
  down: {
    name: 'white',
    color: '#FFFFFF',
    texture: getFaceTexture('#FFFFFF'),
  },
  front: {
    name: 'green',
    color: '#009D54',
    texture: getFaceTexture('#009D54'),
  },
  back: {
    name: 'blue',
    color: '#3D81F6',
    texture: getFaceTexture('#3D81F6'),
  },
  left: {
    name: 'red',
    color: '#DC422F',
    texture: getFaceTexture('#DC422F'),
  },
  right: {
    name: 'orange',
    color: '#FF6C00',
    texture: getFaceTexture('#FF6C00'),
  },
  default: {
    name: 'black',
    color: '#000000',
    texture: getFaceTexture('#000000'),
  },
}

scene = new THREE.Scene()

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
)

camera.position.set(rank * 1.3, rank * 1.3, rank * 1.3)

controls = new THREE.OrbitControls(camera)
controls.enableKeys = false

renderer = new THREE.WebGLRenderer({ alpha: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

cubeGroup = new THREE.Group()

function getFaceTexture(color) {
  var canvas = document.createElement('canvas')
  var width = 256
  var height = 256
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  ctx.rect(20, 20, 216, 216)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 20
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.fill()

  var texture = new THREE.Texture(canvas)
  texture.needsUpdate = true

  return texture
}

function initCube() {
  var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)

  var counter = 0
  for (var z = 0; z < rank; z++) {
    for (var y = 0; y < rank; y++) {
      for (var x = 0; x < rank; x++) {
        // 只生成有效方块
        if (
          x === 0 ||
          y === 0 ||
          z === 0 ||
          x === rank - 1 ||
          y === rank - 1 ||
          z === rank - 1
        ) {
          var materials = [
            new THREE.MeshBasicMaterial({
              map: x === rank - 1 ? faces.right.texture : faces.default.texture,
            }), // right
            new THREE.MeshBasicMaterial({
              map: x === 0 ? faces.left.texture : faces.default.texture,
            }), // left
            new THREE.MeshBasicMaterial({
              map: y === rank - 1 ? faces.up.texture : faces.default.texture,
            }), // top
            new THREE.MeshBasicMaterial({
              map: y === 0 ? faces.down.texture : faces.default.texture,
            }), // bottom
            new THREE.MeshBasicMaterial({
              map: z === rank - 1 ? faces.front.texture : faces.default.texture,
            }), // front
            new THREE.MeshBasicMaterial({
              map: z === 0 ? faces.back.texture : faces.default.texture,
            }), // back
          ]

          var cube = new THREE.Mesh(geometry, materials)
          cube.position.set(
            x - rank / 2 + cubeSize / 2,
            y - rank / 2 + cubeSize / 2,
            z - rank / 2 + cubeSize / 2,
          )

          cubeGroup.add(cube)
        }
      }
    }
  }
}

function filterPrecision(number) {
  return parseFloat(number.toFixed(10))
}

function getNormalMatrix(obj, face) {
  var normalMatrix = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld)

  var normal = face.normal
    .clone()
    .applyMatrix3(normalMatrix)
    .normalize()

  normal.set(
    filterPrecision(normal.x),
    filterPrecision(normal.y),
    filterPrecision(normal.z),
  )

  return normal
}

function rotate(intersection, dire) {
  var rotateGroup = new THREE.Group()
  var normal = getNormalMatrix(intersection.object, intersection.face)
  var _dire = ''
  var deg = 0

  if (normal.x !== 0) {
    switch (dire) {
      case 'up':
        _dire = 'Z'
        deg = normal.x * 90
        break
      case 'down':
        _dire = 'Z'
        deg = normal.x * -90
        break
      case 'left':
        _dire = 'Y'
        deg = normal.x * -90
        break
      case 'right':
        _dire = 'Y'
        deg = normal.x * 90
        break
    }
  } else if (normal.y !== 0) {
    switch (dire) {
      case 'up':
        _dire = 'X'
        deg = normal.y * 90
        break
      case 'down':
        _dire = 'X'
        deg = normal.y * -90
        break
      case 'left':
        _dire = 'Z'
        deg = normal.y * 90
        break
      case 'right':
        _dire = 'Z'
        deg = normal.y * -90
        break
    }
  } else if (normal.z !== 0) {
    switch (dire) {
      case 'up':
        _dire = 'X'
        deg = normal.z * -90
        break
      case 'down':
        _dire = 'X'
        deg = normal.z * 90
        break
      case 'left':
        _dire = 'Y'
        deg = normal.z * -90
        break
      case 'right':
        _dire = 'Y'
        deg = normal.z * 90
        break
    }
  }

  for (var i = cubeGroup.children.length - 1; i >= 0; i--) {
    if (
      Math.abs(
        cubeGroup.children[i].position[_dire.toLocaleLowerCase()] -
          intersection.object.position[_dire.toLocaleLowerCase()],
      ) <= 0.01
    ) {
      rotateGroup.add(cubeGroup.children[i])
    }
  }

  rotateGroup['rotate' + _dire](THREE.Math.degToRad(deg))
  rotateGroup.updateMatrixWorld(false)

  rotateGroup.children.forEach(cube => {
    cube.applyMatrix(rotateGroup.matrixWorld)
    cube.updateMatrixWorld(false)
  })

  cubeGroup.add.apply(cubeGroup, rotateGroup.children)
}

var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()

function onMouseMove(event) {
  if (selectedArrow) {
    selectedArrow.material.color.set('#c7c1b2')
  }
  isOnCube = false
  renderer.domElement.style.cursor = 'default'
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  var cubeIntersects = raycaster.intersectObjects(cubeGroup.children)

  if (cubeIntersects.length) {
    isOnCube = true
    var cubeFaceNormal = getNormalMatrix(
      cubeIntersects[0].object,
      cubeIntersects[0].face,
    )
    var ctrlGroupPosition = cubeRotateCtrlGroup.position

    cubeRotateCtrlGroup.position.copy(cubeIntersects[0].object.position)

    cubeRotateCtrlGroup.position.add(cubeFaceNormal.divideScalar(2))

    if (cubeFaceNormal.x !== 0) {
      cubeRotateCtrlGroup.rotation.set(0, THREE.Math.degToRad(90), 0)
      ctrlGroupPosition.set(
        ctrlGroupPosition.x +
          (ctrlGroupPosition.x / Math.abs(ctrlGroupPosition.x)) * 0.01,
        ctrlGroupPosition.y,
        ctrlGroupPosition.z,
      )
    } else if (cubeFaceNormal.y !== 0) {
      cubeRotateCtrlGroup.rotation.set(THREE.Math.degToRad(90), 0, 0)
      ctrlGroupPosition.set(
        ctrlGroupPosition.x,
        ctrlGroupPosition.y +
          (ctrlGroupPosition.y / Math.abs(ctrlGroupPosition.y)) * 0.01,
        ctrlGroupPosition.z,
      )
    } else if (cubeFaceNormal.z !== 0) {
      cubeRotateCtrlGroup.rotation.set(0, 0, 0)
      ctrlGroupPosition.set(
        ctrlGroupPosition.x,
        ctrlGroupPosition.y,
        ctrlGroupPosition.z +
          (ctrlGroupPosition.z / Math.abs(ctrlGroupPosition.z)) * 0.01,
      )
    }

    // console.log(selectedCude.face)
    // calculate objects intersecting the picking ray
    var ctrlIntersects = raycaster.intersectObjects(
      cubeRotateCtrlGroup.children,
    )

    if (ctrlIntersects.length) {
      renderer.domElement.style.cursor = 'pointer'
      selectedArrow = ctrlIntersects[0].object
      selectedArrow.material.color.set('#a7a1a2')
    }
  }
}

window.addEventListener('mousemove', onMouseMove, false)

function onMouseDown(event) {
  selectedCude = null

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  var cubeIntersects = raycaster.intersectObjects(cubeGroup.children)

  if (cubeIntersects.length) {
    selectedCude = cubeIntersects[0]
  }

  var ctrlIntersects = raycaster.intersectObjects(cubeRotateCtrlGroup.children)

  if (ctrlIntersects.length && selectedCude) {
    rotate(selectedCude, ctrlIntersects[0].object.name)
  }
}

window.addEventListener('mousedown', onMouseDown, false)

function rotateCtrlShow() {
  cubeRotateCtrlGroup.children.forEach(item => {
    item.material.opacity = Math.min(1, item.material.opacity + 0.1)
  })
}

function rotateCtrlHidden() {
  cubeRotateCtrlGroup.children.forEach(item => {
    item.material.opacity = Math.max(0, item.material.opacity - 0.1)
  })
}

function upadte(time) {
  // deltaTime = time - lastTimer

  if (isOnCube) {
    rotateCtrlShow()
  } else {
    rotateCtrlHidden()
  }

  requestAnimationFrame(upadte)

  // if (autoRotate) {
  //   group.rotateY(THREE.Math.degToRad(1))
  // }

  // if (rotationQueue.length) {
  //   var result = rotationQueue[0]()
  //   if (typeof result === 'function') {
  //     rotationQueue[0] = result
  //     result = rotationQueue[0]()
  //   }
  //   if (result) {
  //     rotationQueue.shift()
  //   }
  // }

  // controls.update()

  // lastTimer = time
  renderer.render(scene, camera)
}

var cubeRotateCtrlGroup = new THREE.Group()
cubeRotateCtrlGroup.renderOrder = 5

function addRotateCtrlShape(shape, name, x, y, z, rx, ry, rz) {
  var geometry = new THREE.ShapeBufferGeometry(shape)
  var mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#c7c1b2'),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  )
  mesh.position.set(x, y, z)
  mesh.rotation.set(
    THREE.Math.degToRad(rx),
    THREE.Math.degToRad(ry),
    THREE.Math.degToRad(rz),
  )
  mesh.scale.set(0.5, 0.5, 0.5)

  mesh.name = name

  cubeRotateCtrlGroup.add(mesh)
}

function genTriangleShape() {
  var triangleShape = new THREE.Shape()
  triangleShape.moveTo(-0.25, 0.125)
  triangleShape.lineTo(0.25, 0.125)
  triangleShape.lineTo(0, -0.125)
  triangleShape.lineTo(-0.25, 0.125)

  return triangleShape
}

function start() {
  initCube()
  scene.add(cubeGroup)

  // var axes = new THREE.AxesHelper(500)
  // scene.add(axes)

  var triangleShape = genTriangleShape()
  addRotateCtrlShape(triangleShape, 'down', 0, -0.3, 0, 0, 0, 0)
  addRotateCtrlShape(triangleShape, 'up', 0, 0.3, 0, 0, 0, 180)
  addRotateCtrlShape(triangleShape, 'right', 0.3, 0, 0, 0, 0, 90)
  addRotateCtrlShape(triangleShape, 'left', -0.3, 0, 0, 0, 0, 270)

  cubeRotateCtrlGroup.position.set(0, 0, 2.01)
  scene.add(cubeRotateCtrlGroup)

  upadte(0)
}

start()
