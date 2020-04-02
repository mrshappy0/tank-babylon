class Dude {
  constructor(dudeMesh, speed){
    this.dudeMesh = dudeMesh;
    dudeMesh.Dude = this;
    if(speed){     
      this.speed = speed; 
    }else {
      this.speed = 1;
    }
  }

  move(){
    var tank = scene.getMeshByName("heroTank");
      var direction = tank.position.subtract(this.dudeMesh.position);
      var distance = direction.length();
      var dir = direction.normalize();
      var alpha = Math.atan2(-1 * dir.x, -1 * dir.z);
      this.dudeMesh.rotation.y = alpha;
      if (distance > 30){
        this.dudeMesh.moveWithCollisions(dir.multiplyByFloats(this.speed, this.speed, this.speed))
  }
}
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
    heroDude.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
    heroDude.speed = 1;
    scene.beginAnimation(skeletons[0], 0, 120, true, 1.0);
    var hero = new Dude(heroDude, 2);
  }
}
