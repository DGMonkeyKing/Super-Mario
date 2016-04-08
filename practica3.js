window.addEventListener("load",function() {
	var Q = Quintus({ development: true });
	Q.include("Scenes, TMX, Sprites, 2D, Anim, UI, Touch, Input").setup({maximize: false, width: 320, height:  480});
	Q.controls();
	Q.touch();

	var gameEnded = false;
	
	Q.animations("mario", {
		stand_right: {frames: [0], rate: 1/5},
		stand_left: {frames: [14], rate: 1/5},
		run_right: {frames: [1,2,3], rate: 1/5},
		run_left: {frames: [15,16,17], rate: 1/5},
		jump_right: {frames: [4], rate: 1/5},
		jump_left: {frames: [18], rate: 1/5},
		die_right: {frames: [12], loop: false, rate: 5, trigger: "died"},
		die_left: {frames: [26], loop:false, rate: 5, trigger: "died"}
	});

	Q.animations("goomba_s", {
		stand: {frames: [0], rate: 1/3},
		move: {frames: [0,1], rate: 1/3},
		kill: {frames: [2], loop: false, rate: 1/2, trigger: "killed"}
	});

	Q.animations("bloopa_s", {
		release:{frames: [0], rate: 1/3},
		charge: {frames: [1], rate: 1/3},
		kill: {frames: [2], loop: false, rate: 1/2, trigger: "killed"}
	});

	Q.Sprite.extend("Mario", {
		init: function(p){

			this._super(p, {sprite: "mario",sheet: "mario_small", 
				x: 150,y: 380, dir: "right", time: 0,
				vy_aux: 0, inAir: false});
			this.add('2d, platformerControls, animation');

			this.on("hit.sprite",function(collision) {
      			if(collision.obj.isA("Princess")) {
        			Q.stageScene("endGame",1, { label: "You Won!" }); 
      			}
    		});

    		this.on("died", this, "destroy");
		},

		dying: function(){
			this.del('2d, platformerControls');
			this.play("die_"+this.p.dir,1);
			gameEnded = true;
			this.p.vy = -5;
		},

		step: function(dt){
			if(gameEnded){
				this.p.time+=dt;
				if(this.p.time >= 0.5){
					this.p.vy += 9.4*dt;
					this.p.y+=this.p.vy;
				}
			}else{
				if(this.p.y > Q.height+200){
					Q.clearStages();
	    			Q.stageScene('level1');
				}

				if(this.p.vy_aux != this.p.vy){
					this.p.inAir = true;
				}else{
					this.p.inAir = false;
				}

				this.p.vy_aux = this.p.vy;

				if(!this.p.inAir) this.p.dir = this.p.direction;

				if(this.p.inAir){
					this.play("jump_" + this.p.dir);
				}else if(this.p.vx > 0){
					this.play("run_right");
				}else if(this.p.vx < 0){
					this.play("run_left");
				}else{
					this.play("stand_" + this.p.dir);
				}
			}
		}
	});

	Q.Sprite.extend("Goomba",{
		init: function(p) {
			this._super(p, { sprite: 'goomba_s', sheet: 'goomba',
				vx: 90});
    		this.add('2d, aiBounce, animation');
    
    		this.on("bump.top",function(collision) {
	      		if(collision.obj.isA("Mario")) { 
	      			this.play("kill",1);
	      			this.p.vx = 0;
	        		collision.obj.p.vy = -300;
	      		}
	    	});

	    	this.on("bump.left,bump.right,bump.bottom",function(collision) {
	    		if(collision.obj.isA("Mario")) { 
	        		Q.stageScene("endGame",1, { label: "You Died" }); 
	        		collision.obj.dying();
	      		}
	    	});

	    	this.on("killed", this, "destroy");
  		},

  		step:function(dt){
  			if(!gameEnded) this.play("move");
  			else{
  				this.del('2d');
  				this.play("stand");
  			} 
  		}
	});

	Q.Sprite.extend("Bloopa",{
		init: function(p) {
			this._super(p, { sprite: 'bloopa_s', sheet: 'bloopa',
				vy: -300, killed: false, time: 0});
    		this.add('2d, animation');
    
    		this.on("bump.top",function(collision) {
	      		if(collision.obj.isA("Mario")) { 
	        		this.play("kill");
	        		this.p.vy = 100;
	        		collision.obj.p.vy = -300;
	      		}
	    	});

	    	this.on("bump.left,bump.right,bump.bottom",function(collision) {
	    		if(collision.obj.isA("Mario")) { 
	        		Q.stageScene("endGame",1, { label: "You Died" }); 
	        		collision.obj.dying();
	      		}
	    	});

	    	this.on("killed", this, "destroy");

	    	this.on("step", function(dt) {
	    		if(!gameEnded){
	    			this.play("release");

	    			if (this.p.vy>=150){
	    				this.play("charge");
	    			} 

			    	if(this.p.vy == 0) this.p.vy = -450;
			    }else{
			    	this.del('2d');
			    }
	    	});
  		}
	});

	Q.Sprite.extend("Princess", {
	 	init: function(p) {
	    	this._super(p, { sheet: 'princess' });
	  	}
	});

	Q.Sprite.extend("MainTitle", {
	 	init: function(p) {
	    	this._super(p, { sheet: 'mainTitle' });
	  	}
	});

	Q.scene('endGame',function(stage) {
		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  	}));
	  
	  	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
	                                           label: "Play Again" }));         
	  	var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
	                                        label: stage.options.label }));
	  	button.on("click",function() {
	    	Q.clearStages();
	    	gameEnded = false;
	    	Q.stageScene('startGame');
	  	});
	  	box.fit(20);
	});

	Q.scene('startGame',function(stage) {

		stage.insert(new Q.MainTitle({x:160, y: 240}));

		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0)"
	  	}));
	  
		var button = box.insert(new Q.UI.Button({ x: 0, y: 0, h:480, w:320, fill: "rgba(0,0,0,0)"}));         
	  	button.on("click",function() {
	    	Q.clearStages();
	    	Q.stageScene('level1');
	  	});
	  	button.on("step",function() {
	    	if(Q.inputs['fire']){
		    	Q.clearStages();
		    	Q.stageScene('level1');
		    }
	  	});
	  	box.fit(1000);
	});

	Q.scene("level1", function(stage){
		Q.stageTMX("level.tmx",stage);
		
		stage.insert(new Q.Bloopa({x: 300, y: 420}));

		stage.insert(new Q.Goomba({x: 500, y: 420}));
		stage.insert(new Q.Goomba({x: 1550, y: 420}));
		stage.insert(new Q.Goomba({x: 1500, y: 420}));
		stage.insert(new Q.Princess({x: 1900, y: 452}));

		var player = stage.insert(new Q.Mario());
		stage.add("viewport").follow(player,{x:true, y:false});
		stage.centerOn(160,370);
	});

	Q.load("mario_small.png, mario_small.json, goomba.png, goomba.json, bloopa.png, bloopa.json, princess.png, mainTitle.png", function() {
	 	Q.sheet("mainTitle","mainTitle.png", { tilew: 320, tileh: 480 });
	 	Q.sheet("mario_small","mario_small.png", { tilew: 32, tileh: 32 });
	 	Q.sheet("goomba","goomba.png", { tilew: 32, tileh: 32 });
	 	Q.sheet("bloopa","bloopa.png", { tilew: 32, tileh: 32 });
	 	Q.sheet("princess","princess.png", { tilew: 30, tileh: 48 });
		Q.compileSheets("mario_small.png","mario_small.json");
		Q.compileSheets("goomba.png","goomba.json");
		Q.compileSheets("bloopa.png","bloopa.json");
		Q.stageScene("startGame",2);
	});

	Q.loadTMX("level.tmx", function(){
		
	});
});
