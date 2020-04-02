var canvas;
var engine;
var scene;
var isWPressed = false;
var isSPressed = false;
var isAPressed = false;
var isDPressed = false;
var isBPressed = false;
var isRPressed = false;

document.addEventListener("DOMContentLoaded", startGame);

class Dude {
  constructor(dudeMesh, speed, id, scene, scaling) {
    this.dudeMesh = dudeMesh;
    this.id = id;
    this.scene = scene;
    dudeMesh.Dude = this;
    if (speed) {
      this.speed = speed;
    } else {
      this.speed = 1;
    }
    if (scaling) {
      this.scaling = scaling;
      this.dudeMesh.scaling = new BABYLON.Vector3(
        this.scaling,
        this.scaling,
        this.scaling
      );
    } else {
      this.scaling = 1;
    }
    if (Dude.boundingBoxParameters == undefined) {
      Dude.boundingBoxParameters = this.CalculateBoundingBoxParameters();
    }
    this.bounder = this.createBoundingBox();
    this.bounder.dudeMesh = this.dudeMesh;
  }
  createBoundingBox() {
    var lengthX = Dude.boundingBoxParameters.lengthX;
    var lengthY = Dude.boundingBoxParameters.lengthY;
    var lengthZ = Dude.boundingBoxParameters.lengthZ;
    var bounder = new BABYLON.Mesh.CreateBox(
      "bounder" + this.id,
      1,
      this.scene
    );
    bounder.scaling.x = lengthX * this.scaling;
    bounder.scaling.y = lengthY * this.scaling;
    bounder.scaling.z = lengthZ * this.scaling;

    bounder.isVisible = false;
    var bounderMaterial = new BABYLON.StandardMaterial(
      "bounderMaterial",
      this.scene
    );
    bounderMaterial.alpha = 0.5;
    bounder.material = bounderMaterial;
    bounder.checkCollisions = true;

    (bounder.position = new BABYLON.Vector3(
      this.dudeMesh.position.x,
      this.dudeMesh.position.y + (this.scaling * lengthY) / 2
    )),
      this.dudeMesh.position.z;
    return bounder;
  }

  CalculateBoundingBoxParameters() {
    var minX = 9999999;
    var minY = 9999999;
    var minZ = 9999999;
    var maxX = -9999999;
    var maxY = -9999999;
    var maxZ = -9999999;

    var children = this.dudeMesh.getChildren();

    for (var i = 0; i < children.length; i++) {
      var positions = new BABYLON.VertexData.ExtractFromGeometry(children[i])
        .positions;
      if (!positions) continue;
      for (var j = 0; j < positions.length; j += 3) {
        if (positions[j] < minX) {
          minX = positions[j];
        }
        if (positions[j] > maxX) {
          maxX = positions[j];
        }
      }
      for (var j = 1; j < positions.length; j += 3) {
        if (positions[j] < minY) {
          minY = positions[j];
        }
        if (positions[j] > maxY) {
          maxY = positions[j];
        }
      }
      for (var j = 2; j < positions.length; j += 3) {
        if (positions[j] < minZ) {
          minZ = positions[j];
        }
        if (positions[j] > maxZ) {
          maxZ = positions[j];
        }
      }
      var _lengthX = maxX - minX;
      var _lengthY = maxY - minY;
      var _lengthZ = maxZ - minZ;
    }
    return { lengthX: _lengthX, lengthY: _lengthY, lengthZ: _lengthZ };
  }

  move() {
    if (!this.bounder) return;
    this.dudeMesh.position = new BABYLON.Vector3(
      this.bounder.position.x,
      this.bounder.position.y -
        (this.scaling * Dude.boundingBoxParameters.lengthY) / 2,
      this.bounder.position.z
    );
    var tank = scene.getMeshByName("heroTank");
    var direction = tank.position.subtract(this.dudeMesh.position);
    var distance = direction.length();
    var dir = direction.normalize();
    var alpha = Math.atan2(-1 * dir.x, -1 * dir.z);
    this.dudeMesh.rotation.y = alpha;
    if (distance > 30) {
      this.bounder.moveWithCollisions(
        dir.multiplyByFloats(this.speed, this.speed, this.speed)
      );
    }
  }
}

function startGame() {
  canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  scene = createScene();
  // modifySettings();
  var tank = scene.getMeshByName("heroTank");
  var toRender = function() {
    tank.move();
    tank.fireCannonBalls();
    tank.fireLaserBeams();
    moveHeroDude();
    moveOtherDudes();
    scene.render();
  };
  engine.runRenderLoop(toRender);
}

var createScene = function() {
  var scene = new BABYLON.Scene(engine);
  var physicsPlugin = new BABYLON.CannonJSPlugin();
  var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  scene.enablePhysics(gravityVector, physicsPlugin);
  var ground = CreateGround(scene);
  var freeCamera = createUniversalCamera(scene);
  var tank = createTank(scene);
  var followCamera = createFollowCamera(scene, tank);
  scene.activeCamera = followCamera;
  createLights(scene);
  createHeroDude(scene);
  return scene;
};

function CreateGround(scene) {
  var ground = new BABYLON.Mesh.CreateGroundFromHeightMap(
    "ground",
    "images/hmap1.png",
    500,
    500,
    100,
    0,
    50,
    scene,
    false,
    OnGroundCreated
  );
  function OnGroundCreated() {
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture(
      "images/grass.jpg",
      scene
    );
    ground.material = groundMaterial;
    ground.checkCollisions = true;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.HeightmapImpostor,
      { mass: 0 },
      scene
    );
  }
  return ground;
}

function createLights(scene) {
  var light0 = new BABYLON.DirectionalLight(
    "dir0",
    new BABYLON.Vector3(-0.1, -1, 0),
    scene
  );
  var light1 = new BABYLON.DirectionalLight(
    "dir1",
    new BABYLON.Vector3(-1, -1, 0),
    scene
  );
}

function createFollowCamera(scene, target) {
  var camera = new BABYLON.FollowCamera(
    "tankFollowCamera",
    target.position,
    scene,
    target
  );
  camera.radius = 20; // how far from the object to follow
  camera.heightOffset = 4; // how high above object to place camera
  camera.rotationOffset = 180; //the viewing angle
  camera.cameraAcceleration = 0.5; // how fast to move
  camera.maxCameraSpeed = 50; //speed limit
  return camera;
}

function createUniversalCamera(scene) {
  var camera = new BABYLON.UniversalCamera(
    "UniversalCamera",
    new BABYLON.Vector3(
      -118.37268800277741,
      50.18638187910689,
      -57.51010707965682
    ),
    scene
  );
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  camera.checkCollisions = true;
  camera.keysUp.push("w".charCodeAt(0));
  camera.keysUp.push("W".charCodeAt(0));
  camera.keysDown.push("s".charCodeAt(0));
  camera.keysDown.push("S".charCodeAt(0));
  camera.keysRight.push("d".charCodeAt(0));
  camera.keysRight.push("D".charCodeAt(0));
  camera.keysLeft.push("a".charCodeAt(0));
  camera.keysLeft.push("A".charCodeAt(0));
  // scene.onPointerPick = function() {
  //   console.log(camera.position);
  // };
  return camera;
}

function createHeroDude(scene) {
  BABYLON.SceneLoader.ImportMesh(
    "him",
    "models/Dude/",
    "Dude.babylon",
    scene,
    onDudeImported
  );
  function onDudeImported(newMeshes, particleSystems, skeletons) {
    newMeshes[0].position = new BABYLON.Vector3(0, 0, 5); // The original dude
    newMeshes[0].name = "heroDude";
    var heroDude = newMeshes[0];
    for (var i = 1; i < heroDude.getChildren().length; i++) {
      // console.log(heroDude.getChildren()[i].name);
      heroDude.getChildren()[i].name = "clone_".concat(
        heroDude.getChildren()[i].name
      );
      // console.log(heroDude.getChildren()[i].name);
    }
    // heroDude.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
    heroDude.speed = 1;
    scene.beginAnimation(skeletons[0], 0, 120, true, 1.0);
    var hero = new Dude(heroDude, 2, -1, scene, 0.2);
    scene.dudes = [];
    scene.dudes[0] = heroDude;
    for (var q = 1; q <= 10; q++) {
      scene.dudes[q] = doClone(heroDude, skeletons, q);
      scene.beginAnimation(scene.dudes[q].skeleton, 0, 120, true, 1.0);
      var temp = new Dude(scene.dudes[q], 2, q, scene, 0.2);
    }
  }
}

function doClone(original, skeletons, id) {
  var myClone;
  var xrand = Math.floor(Math.random() * 501) - 250;
  var zrand = Math.floor(Math.random() * 501) - 250;
  myClone = original.clone("clone_" + id);
  myClone.position = new BABYLON.Vector3(xrand, 0, zrand);
  if (!skeletons) {
    return myClone;
  } else {
    if (!original.getChildren()) {
      myClone.skeleton = skeletons[0].clone("clone_" + id + " _skeleton");
      return myClone;
    } else {
      if (skeletons.length == 1) {
        // this means on skeleton controlling/animating all the children
        var clonedSkeleton = skeletons[0].clone("clone_" + id + "_skeleton");
        myClone.skeleton = clonedSkeleton;
        var numChildren = myClone.getChildren().length;
        for (var i = 0; i < numChildren; i++) {
          myClone.getChildren()[i].skeleton = clonedSkeleton;
        }
        return myClone;
      } else if (skeletons.length == original.getChildren().length) {
        //Most probably each child has its own skeleton
        for (var i = 0; i < myClone.getChildren().length; i++) {
          myClone.getChildren()[i].skeleton = skeletons[i].clone(
            "clone_" + id + "skeleton_" + i
          );
        }
        return myClone;
      }
    }
  }
}

function modifySettings() {
  scene.onPointerDown = function() {
    canvas.requestPointerLock();
  };
}

function createTank() {
  var tank = new BABYLON.MeshBuilder.CreateBox(
    "heroTank",
    { height: 1, depth: 6, width: 6 },
    scene
  );
  var tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
  tankMaterial.diffuseColor = new BABYLON.Color3.Red();
  tankMaterial.emissiveColor = new BABYLON.Color3.Blue();
  tank.material = tankMaterial;
  tank.position.y += 2;
  tank.position.z += 2;
  tank.speed = 3;
  tank.frontVector = new BABYLON.Vector3(0, 0, 1);
  tank.canFireCannonBalls = true;
  tank.canFireLaser = true;
  // tank.isPickable = false;
  tank.move = function() {
    if (isWPressed) {
      if (tank.position.y > 2) {
        tank.moveWithCollisions(new BABYLON.Vector3(0, -1, 0));
      } else {
        tank.moveWithCollisions(
          tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed)
        );
      }
    }
    if (isSPressed) {
      if (tank.position.y > 2) {
        tank.moveWithCollisions(new BABYLON.Vector3(0, -1, 0));
      } else {
        tank.moveWithCollisions(
          tank.frontVector.multiplyByFloats(
            -1 * tank.speed,
            -1 * tank.speed,
            -1 * tank.speed
          )
        );
      }
    }
    if (isAPressed) {
      tank.rotation.y -= 0.08;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
    if (isDPressed) {
      tank.rotation.y += 0.08;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
  };

  tank.fireCannonBalls = function() {
    var tank = this;
    if (!isBPressed) return;
    if (!tank.canFireCannonBalls) return;
    console.log("thing");
    tank.canFireCannonBalls = false;

    setTimeout(function() {
      tank.canFireCannonBalls = true;
    }, 500);

    var cannonBall = new BABYLON.Mesh.CreateSphere("cannonball", 32, 2, scene);
    cannonBall.material = new BABYLON.StandardMaterial("Fire", scene);
    cannonBall.material.diffuseTexture = new BABYLON.Texture(
      "images/Fire.jpg",
      scene
    );
    var pos = tank.position;

    cannonBall.position = new BABYLON.Vector3(pos.x, pos.y + 1, pos.z);
    cannonBall.position.addInPlace(tank.frontVector.multiplyByFloats(5, 5, 5));

    cannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(
      cannonBall,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1 },
      scene
    );
    var fVector = tank.frontVector;
    var force = new BABYLON.Vector3(
      fVector.x * 100,
      (fVector.y + 1) * 10,
      fVector.z * 100
    );
    cannonBall.physicsImpostor.applyImpulse(
      force,
      cannonBall.getAbsolutePosition()
    );
    cannonBall.actionManager = new BABYLON.ActionManager(scene);

    scene.dudes.forEach(dude => {
      cannonBall.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          {
            trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
            parameter: dude.Dude.bounder
          },
          () => {
            dude.Dude.bounder.dispose();
            dude.dispose();
          }
        )
      );
    });

    setTimeout(function() {
      cannonBall.dispose();
    }, 3000);
  };

  tank.fireLaserBeams = function() {
    var tank = this;
    if (!isRPressed) return;
    if (!tank.canFireLaser) return;
    console.log("hit");
    tank.canFireLaser = false;

    setTimeout(function() {
      tank.canFireLaser = true;
    }, 500);

    var origin = tank.position;
    var direction = new BABYLON.Vector3(
      tank.frontVector.x,
      tank.frontVector.y + 0.1,
      tank.frontVector.z
    );

    var ray = new BABYLON.Ray(origin, direction, 1000);
    var rayHelper = new BABYLON.RayHelper(ray);
    rayHelper.show(scene, new BABYLON.Color3.Red());

    setTimeout(function() {
      rayHelper.hide(ray);
    }, 200);

    var pickInfos = scene.multiPickWithRay(ray, mesh => {
      //use multiPick instead of pickWithRay to pick everything it hits instead of closest
      // this requires you to loop through everything it hits
      if (mesh.name == "heroTank") {
        return false;
      } else {
        return true;
      }
    });
    for (let i = 0; i < pickInfos.length; i++) {
      var pickInfo = pickInfos[i];
      if (pickInfo.pickedMesh) {
        if (pickInfo.pickedMesh.name.startsWith("bounder")) {
          var bounder = pickInfo.pickedMesh;
          bounder.dudeMesh.dispose();
          bounder.dispose();
        } else if (pickInfo.pickedMesh.name.startsWith("clone")) {
          var child = pickInfo.pickedMesh;
          child.parent.dispose();
        }
      }
    }
    // console.log(pickInfo.pickedMesh.name) sometimes the bounder sometimes the mesh
  };

  return tank;
}
document.addEventListener("keydown", function() {
  if (event.key == "w" || event.key == "W") {
    isWPressed = true;
  }
  if (event.key == "s" || event.key == "S") {
    isSPressed = true;
  }
  if (event.key == "a" || event.key == "A") {
    isAPressed = true;
  }
  if (event.key == "d" || event.key == "D") {
    isDPressed = true;
  }
  if (event.key == "b" || event.key == "B") {
    isBPressed = true;
  }
  if (event.key == "r" || event.key == "R") {
    isRPressed = true;
  }
});

document.addEventListener("keyup", function() {
  if (event.key == "w" || event.key == "W") {
    isWPressed = false;
  }
  if (event.key == "s" || event.key == "S") {
    isSPressed = false;
  }
  if (event.key == "a" || event.key == "A") {
    isAPressed = false;
  }
  if (event.key == "d" || event.key == "D") {
    isDPressed = false;
  }
  if (event.key == "b" || event.key == "B") {
    isBPressed = false;
  }
  if (event.key == "r" || event.key == "R") {
    isRPressed = false;
  }
});

function moveHeroDude() {
  var heroDude = scene.getMeshByName("heroDude");
  if (heroDude) {
    heroDude.Dude.move();
  }
}

function moveOtherDudes() {
  if (scene.dudes) {
    for (var q = 0; q < scene.dudes.length; q++) {
      scene.dudes[q].Dude.move();
    }
  }
}

// Resize
window.addEventListener("resize", function(camera) {
  engine.resize();
});
