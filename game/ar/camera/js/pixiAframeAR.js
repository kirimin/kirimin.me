window.onload = function () {
	var marker = document.querySelector('a-marker');
	if(!marker){ marker = document.querySelector('a-marker-camera'); }
	var camera = document.querySelector("a-entity[camera]");
	if(!camera){ camera = document.querySelector("a-marker-camera"); }
	camera = camera.components.camera.camera;

	//��ʂ̉�]�t���O
	var orientationchanged = false;
	//�}�[�J�[�ɑ΂��Ă̒����t���O
	var stand_mode = false;

	var models = [];
	var app = new PIXI.Application(0, 0, { transparent: true });
	loadAssets().then(addModel).then(addPlane);

	function loadAssets() {
		//���[�V�����̐ݒ�
		function setMotion(model, resources, x, y, resolve, reject){
			if (model == null){ reject(); }

			//��{���[�V����
			var motions = [];
			var animation = LIVE2DCUBISMFRAMEWORK.Animation;
			var override = LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE;
			motions.push(animation.fromMotion3Json(resources['motion2'].data));
			model.motions = motions;
			model.animator.addLayer("motion", override, 1);
			//�����_���Ń��[�V�����Đ�
			var rand = Math.floor(Math.random() * model.motions.length);
			model.animator.getLayer("motion").play(model.motions[rand]);

			//�N���b�N���[�V����
			var data = resources['motion1'].data;
			model.click_motion = animation.fromMotion3Json(data);

			//�����Ǐ]���[�V����
			data.CurveCount = data.TotalPointCount = data.TotalSegmentCount = 0;
			data.Curves = [];
			var gaze_motion = animation.fromMotion3Json(data);
			model.animator.addLayer("gaze", override, 1);
			model.animator.getLayer("gaze").play(gaze_motion);

			//�����Ǐ]���[�V�����̃p�����[�^�l�X�V
			model.gaze = new THREE.Vector3();
			var ids = model.parameters.ids;
			var angle_x = Math.max(ids.indexOf("ParamAngleX"), ids.indexOf("PARAM_ANGLE_X"));
			var angle_y = Math.max(ids.indexOf("ParamAngleY"), ids.indexOf("PARAM_ANGLE_Y"));
			var eye_x = Math.max(ids.indexOf("ParamEyeBallX"), ids.indexOf("PARAM_EYE_BALL_X"));
			var eye_y = Math.max(ids.indexOf("ParamEyeBallY"), ids.indexOf("PARAM_EYE_BALL_Y"));
			gaze_motion.evaluate = (time, weight, blend, target, stackFlags, groups) => {
				if(stand_mode){ model.gaze.y *= 0.1; }
				var values = target.parameters.values;
				var max = target.parameters.maximumValues;
				var min = target.parameters.minimumValues;
				var angle_h = model.gaze.x > 0 ? max[angle_x] : -min[angle_x];
				var angle_v = model.gaze.y > 0 ? max[angle_y] : -min[angle_y];
				var eye_h = model.gaze.x > 0 ? max[eye_x] : -min[eye_x];
				var eye_v = model.gaze.y > 0 ? max[eye_y] : -min[eye_y];
				values[angle_x] = blend(values[angle_x], model.gaze.x * angle_h, 0, weight);
				values[angle_y] = blend(values[angle_y], model.gaze.y * angle_v, 0, weight);
				values[eye_x] = blend(values[eye_x], model.gaze.x * eye_h, 0, weight);
				values[eye_y] = blend(values[eye_y], model.gaze.y * eye_v, 0, weight);
			}

			//�L�����o�X��̃��f���̈ʒu
			model.pos_x = x;
			model.pos_y = y;

			models.push(model);
			resolve();
		}
		//�A�Z�b�g�̓ǂݍ���
		var xhrType = { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON };
		var p1 = new Promise(function (resolve, reject) {
			var loader = new PIXI.loaders.Loader();
			loader.add('model3', "assets/kirimin-chan/kirimin-chan.model3.json", xhrType);
			loader.add('motion1', "assets/kirimin-chan/kirimin-chan_01.motion3.json", xhrType);
			loader.add('motion2', "assets/kirimin-chan/kirimin-chan_02.motion3.json", xhrType);
			loader.load(function (loader, resources) {
				var builder = new LIVE2DCUBISMPIXI.ModelBuilder();
				builder.buildFromModel3Json(loader, resources['model3'], complate);
				function complate(model){ setMotion(model, resources, 0.5, 0.5, resolve, reject); }
			});
		});
		return Promise.all([p1]);
	}
	function addModel() {
		//���f���̓o�^
		var p = new Promise(function (resolve, reject) {
			models.forEach(function(model){
				app.stage.addChild(model);
				app.stage.addChild(model.masks);
			});
			app.stage.renderable = false;
			app.ticker.add(function (deltaTime) {
				models.forEach(function(model){
					model.update(deltaTime);
					model.masks.update(app.renderer);
				});
			});
			resolve();
		});
		return Promise.all([p]);
	}
	function addPlane() {
		var plane = document.createElement('a-plane');
		plane.setAttribute('plane', '');
		plane.setAttribute('color', '#000');
		plane.setAttribute('height', '5');
		plane.setAttribute('width', '5');
		//�}�[�J�[���ɂ������f���̑��Έʒu
		plane.setAttribute('position', '0 0 0');
		var stand = stand_mode ? '0 0 0' : '-90 0 0';
		plane.setAttribute('rotation', stand);
		marker.appendChild(plane);

		plane.object3D.front = new THREE.Object3D();
		plane.object3D.front.position.set(0, 0, -1);
		plane.object3D.add(plane.object3D.front);

		var texture = new THREE.Texture(app.view);
		texture.premultiplyAlpha = true;
		var material = new THREE.MeshStandardMaterial({});
		material.map = texture;
		material.metalness = 0;
		material.premultipliedAlpha = true;
		material.transparent = true;
		var mesh = null;

		AFRAME.registerComponent('plane', {
			init: function () {
				mesh = this.el.getObject3D('mesh');
				mesh.material = material;
			},
			update: function(){
				var width = 512;
				var height = 512;
				app.view.width = width + "px";
				app.view.height = height + "px";
				app.renderer.resize(width, height);

				models.forEach(function(model){
					model.position = new PIXI.Point(width * model.pos_x, height * model.pos_y);
					model.scale = new PIXI.Point(width * 0.5, width * 0.5);
					model.masks.resize(app.view.width, app.view.height);
				});

				mesh.material.map.needsUpdate = true;
			},
			tick: function (time, timeDelta) {
				if(marker.object3D.visible){
					//��ʂ���]��������i�����f���̕\���ʒu������Ă���j�łȂ��Ȃ�`�悷��
					if(!orientationchanged){ app.stage.renderable = true; }
					mesh.material.map.needsUpdate = true;

					var pos = plane.object3D.getWorldPosition();
					var gaze = plane.object3D.front.getWorldPosition();
					gaze.sub(pos);
					models.forEach(function(model){ 
						//�����Ǐ]���[�V�����̍X�V
						model.gaze = gaze;

						//�����_���Ń��[�V�����Đ�
						var motion = model.animator.getLayer("motion");
						if(motion && motion.currentTime >= motion.currentAnimation.duration){
							var rand = Math.floor(Math.random() * model.motions.length);
							motion.stop();
							motion.play(model.motions[rand]);
						}
					});
				}else{
					//�}�[�J�[���O�ꂽ��`���~�߂�
					app.stage.renderable = false;
					//�}�[�J�[���O�ꂽ���ʂ̉�]�t���O��܂�
					//���}�[�J�[�̍Č��o���Ƀ��f���̕\���ʒu���C������邽��
					orientationchanged = false;
				}
			}
		});
	}

	var click_event = function (e) {
		//�N���b�N���[�V�����̍Đ�
		models.forEach(function(model){ 
			var motion = model.animator.getLayer("motion");
			if(motion && model.click_motion){
				motion.stop();
				motion.play(model.click_motion);
			}
		});
	}
	//PC�ƃX�}�z�̑I��C�x���g�̐U�蕪��
	if(window.ontouchstart === undefined){
		window.onclick = click_event;
	}else{
		window.ontouchstart = click_event;
	}
	window.onorientationchange = function (e) {
		if (e === void 0) { e = null; }
		//��ʂ���]����ƃ��f���̕\���ʒu������邽�ߕ`���~�߂�
		app.stage.renderable = false;
		//��ʂ̉�]�t���O�𗧂Ă�
		orientationchanged = true;
	}
};
/*
//FPS�̕\��
var script = document.createElement('script');
script.onload=function(){
	var stats = new Stats();
	document.body.appendChild(stats.dom);
	requestAnimationFrame(function loop(){
		stats.update();
		requestAnimationFrame(loop)
	});
};
script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';
document.head.appendChild(script);
*/
