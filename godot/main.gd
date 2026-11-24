extends Node3D

const LANTERN_SCENE: PackedScene = preload("res://assets/starlight_lantern.glb")
const FLOOR_X := 15.0
const PLAYER_SPEED := 5.0
const JUMP_SPEED := 8.0

var player: CharacterBody3D
var camera: Camera3D
var hud: CanvasLayer
var score_label: Label
var prompt_label: Label
var quiz_panel: PanelContainer
var quiz_title: Label
var quiz_feedback: Label
var answer_box: VBoxContainer
var result_panel: PanelContainer
var result_text: Label
var level := 1
var scores := [0, 0]
var attempts := [0, 0]
var key_found := false
var quiz_open := false
var game_finished := false
var enemy_alive := true
var attack_cooldown := 0.0
var interact_hint := ""

func _ready() -> void:
	_build_world()
	_build_player()
	_build_camera()
	_build_hud()
	_update_level_text()
	_add_enemy()

func _process(delta: float) -> void:
	if game_finished:
		if Input.is_key_pressed(KEY_ESCAPE):
			get_tree().quit()
		return
	attack_cooldown = maxf(0.0, attack_cooldown - delta)
	if not quiz_open:
		_update_prompt()
		if Input.is_action_just_pressed("interact"):
			_try_interact()
		if Input.is_action_just_pressed("light_wave"):
			_attack()
		_update_player(delta)
		_update_hud()

func _build_world() -> void:
	var world_env := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("101b3c")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("b8c9ff")
	env.ambient_light_energy = 0.65
	world_env.environment = env
	add_child(world_env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-35, -25, 0)
	sun.light_color = Color("d9e3ff")
	sun.light_energy = 1.2
	add_child(sun)
	_box("Moonlit path", Vector3(FLOOR_X * 2.0, 0.45, 4.0), Vector3(0, -0.28, 0), Color("263857"))
	var ground_body := StaticBody3D.new()
	ground_body.name = "WalkablePath"
	var ground_shape := CollisionShape3D.new()
	var ground_box := BoxShape3D.new()
	ground_box.size = Vector3(FLOOR_X * 2.0, 0.45, 4.0)
	ground_shape.shape = ground_box
	ground_shape.position = Vector3(0, -0.28, 0)
	ground_body.add_child(ground_shape)
	add_child(ground_body)
	for side in [-1.0, 1.0]:
		_box("Pine trunk", Vector3(1.0, 5.0, 0.6), Vector3(side * 7.9, 2.1, -1.4), Color("142b3b"))
		_box("Pine canopy", Vector3(3.1, 2.2, 0.7), Vector3(side * 7.9, 4.1, -1.4), Color("1c4851"))
	for i in range(7):
		var x := -6.5 + float(i) * 2.1
		var orb := _sphere("Firefly", Vector3(x, 4.8 + sin(float(i) * 1.8) * 0.45, -2.2), 0.11, Color("ffe6a3"))
		var firefly_mat := _material(Color("ffe6a3"))
		firefly_mat.emission_enabled = true
		firefly_mat.emission = Color("ffc761")
		firefly_mat.emission_energy_multiplier = 2.0
		orb.material_override = firefly_mat
		if i % 2 == 0:
			_box("Mushroom stem", Vector3(0.22, 0.48, 0.25), Vector3(x, 0.15, 1.1), Color("f0d6ae"))
			_sphere("Mushroom cap", Vector3(x, 0.46, 1.1), 0.34, Color("d97878"))
	_add_sign(Vector3(-4.5, 1.5, -0.2))
	_add_shrine(Vector3(2.9, 0.7, -0.2))
	_add_gate(Vector3(6.0, 1.3, -0.2))
	var lantern := LANTERN_SCENE.instantiate()
	lantern.name = "BlenderStarlightLantern"
	lantern.position = Vector3(0.1, 0.02, -1.25)
	lantern.scale = Vector3(0.72, 0.72, 0.72)
	add_child(lantern)

func _build_player() -> void:
	player = CharacterBody3D.new()
	player.name = "LittleExplorer"
	player.position = Vector3(-5.4, 0.04, 0.15)
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.36
	capsule.height = 1.55
	var collider := CollisionShape3D.new()
	collider.shape = capsule
	collider.position.y = 0.77
	player.add_child(collider)
	var body := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 0.36
	mesh.height = 1.55
	body.mesh = mesh
	body.position.y = 0.77
	body.material_override = _material(Color("f4bd68"))
	player.add_child(body)
	var hood := _sphere("Explorer hood", Vector3(0, 1.45, -0.02), 0.24, Color("ed725f"))
	hood.scale = Vector3(1.0, 1.15, 0.85)
	_attach_to(hood, player)
	var face := _sphere("Explorer face", Vector3(0, 1.34, 0.20), 0.12, Color("ffe4bd"))
	_attach_to(face, player)
	var lamp := _sphere("Tiny lantern", Vector3(0.34, 0.88, 0.26), 0.09, Color("fff0a0"))
	_attach_to(lamp, player)
	player.floor_snap_length = 0.25
	add_child(player)

func _build_camera() -> void:
	camera = Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 10.8
	camera.position = Vector3(0, 4.3, 19.0)
	camera.rotation_degrees = Vector3(-8, 0, 0)
	camera.current = true
	add_child(camera)

func _build_hud() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	var top := PanelContainer.new()
	top.position = Vector2(24, 20)
	top.custom_minimum_size = Vector2(560, 80)
	_style_panel(top, Color("17243be8"), Color("648a9c"))
	hud.add_child(top)
	var top_box := VBoxContainer.new()
	top.add_child(top_box)
	var title := Label.new()
	title.name = "LevelLabel"
	title.add_theme_font_size_override("font_size", 23)
	title.add_theme_color_override("font_color", Color("ffe3a0"))
	top_box.add_child(title)
	score_label = Label.new()
	score_label.add_theme_font_size_override("font_size", 17)
	score_label.add_theme_color_override("font_color", Color("e9f2ff"))
	top_box.add_child(score_label)
	var controls := Label.new()
	controls.text = "A / D 或 ← → 移動    空白鍵 跳躍    E 互動    F 光波"
	controls.position = Vector2(24, 116)
	controls.add_theme_font_size_override("font_size", 17)
	controls.add_theme_color_override("font_color", Color("d1e2f2"))
	hud.add_child(controls)
	prompt_label = Label.new()
	prompt_label.position = Vector2(390, 600)
	prompt_label.size = Vector2(500, 54)
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.add_theme_font_size_override("font_size", 22)
	prompt_label.add_theme_color_override("font_color", Color("fff0ba"))
	hud.add_child(prompt_label)
	quiz_panel = PanelContainer.new()
	quiz_panel.visible = false
	quiz_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	quiz_panel.position = Vector2(-280, -205)
	quiz_panel.custom_minimum_size = Vector2(560, 410)
	_style_panel(quiz_panel, Color("101c32f5"), Color("d5b86f"))
	hud.add_child(quiz_panel)
	var qbox := VBoxContainer.new()
	qbox.add_theme_constant_override("separation", 12)
	quiz_panel.add_child(qbox)
	quiz_title = Label.new()
	quiz_title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quiz_title.custom_minimum_size.y = 132
	quiz_title.add_theme_font_size_override("font_size", 22)
	quiz_title.add_theme_color_override("font_color", Color("fff0c5"))
	qbox.add_child(quiz_title)
	answer_box = VBoxContainer.new()
	answer_box.add_theme_constant_override("separation", 8)
	qbox.add_child(answer_box)
	quiz_feedback = Label.new()
	quiz_feedback.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quiz_feedback.add_theme_font_size_override("font_size", 17)
	quiz_feedback.add_theme_color_override("font_color", Color("bce8d5"))
	qbox.add_child(quiz_feedback)
	result_panel = PanelContainer.new()
	result_panel.visible = false
	result_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_panel.position = Vector2(-330, -210)
	result_panel.custom_minimum_size = Vector2(660, 420)
	_style_panel(result_panel, Color("101c32f7"), Color("d5b86f"))
	hud.add_child(result_panel)
	result_text = Label.new()
	result_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	result_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	result_text.add_theme_font_size_override("font_size", 23)
	result_text.add_theme_color_override("font_color", Color("fff0c5"))
	result_panel.add_child(result_text)

func _update_player(delta: float) -> void:
	var axis := Input.get_axis("move_left", "move_right")
	player.velocity.x = axis * PLAYER_SPEED
	player.velocity.z = 0.0
	player.velocity.y -= 20.0 * delta
	if player.is_on_floor() and Input.is_action_just_pressed("jump"):
		player.velocity.y = JUMP_SPEED
	player.move_and_slide()
	player.position.x = clampf(player.position.x, -7.0, 7.1)
	var desired := Vector3(clampf(player.position.x, -1.1, 1.1), 4.3, 19.0)
	camera.position = camera.position.lerp(desired, minf(1.0, delta * 4.0))

func _update_prompt() -> void:
	interact_hint = ""
	if enemy_alive and absf(player.position.x - 0.4) < 1.8:
		interact_hint = "F：揮出星光，驅散影子小怪"
	elif not key_found and absf(player.position.x - 2.9) < 2.2:
		interact_hint = "E：回答理財問題，取得鑰匙"
	elif key_found and level == 1 and player.position.x > 4.3:
		interact_hint = "E：帶著鑰匙前往下一關"
	prompt_label.text = interact_hint

func _try_interact() -> void:
	if key_found and level == 1 and player.position.x > 4.3:
		_start_level_two()
	elif not key_found and absf(player.position.x - 2.9) < 2.2:
		_open_quiz()

func _attack() -> void:
	if attack_cooldown > 0.0:
		return
	attack_cooldown = 0.55
	if enemy_alive and absf(player.position.x - 0.4) < 2.1:
		enemy_alive = false
		var enemy := get_node_or_null("ShadowMoth")
		if enemy:
			enemy.queue_free()
		scores[level - 1] += 25
		prompt_label.text = "星光驅散了影子！勇氣 +25 分"

func _open_quiz() -> void:
	quiz_open = true
	quiz_panel.visible = true
	prompt_label.text = ""
	for child in answer_box.get_children():
		child.queue_free()
	quiz_feedback.text = ""
	if level == 1:
		quiz_title.text = "月光市集｜預算小挑戰\n你有 100 枚星星幣，先存下 30 枚，必需品花 45 枚。剩下最多能花多少買想要的東西？"
		_add_answer("25 枚：先存、再付必需品", 0)
		_add_answer("30 枚：把存款也算成可花的錢", 1)
		_add_answer("35 枚：忘記把必需品算進去", 2)
	else:
		quiz_title.text = "星光樹屋｜認識風險\n如果把模擬投資星星幣分散在不同類型的籃子裡，最可能有什麼好處？"
		_add_answer("分散風險：單一籃子下跌時不會影響全部", 0)
		_add_answer("保證賺錢：投資一定會上漲", 1)
		_add_answer("完全沒風險：永遠不會虧損", 2)

func _add_answer(caption: String, choice: int) -> void:
	var button := Button.new()
	button.text = caption
	button.custom_minimum_size.y = 49
	button.add_theme_font_size_override("font_size", 17)
	button.pressed.connect(_answer_question.bind(choice))
	answer_box.add_child(button)

func _answer_question(choice: int) -> void:
	if choice == 0:
		quiz_feedback.text = "答對了！你拿到本關鑰匙。"
		scores[level - 1] += maxi(60, 100 - attempts[level - 1] * 10)
		key_found = true
		await get_tree().create_timer(0.9).timeout
		quiz_panel.visible = false
		quiz_open = false
		if level == 2:
			_finish_game()
	else:
		attempts[level - 1] += 1
		quiz_feedback.text = "提示：先把收入分成儲蓄、必需品，最後才是想要的東西。再試一次！"
	_update_hud()

func _start_level_two() -> void:
	level = 2
	key_found = false
	enemy_alive = true
	player.position = Vector3(-5.4, 0.04, 0.15)
	var old_enemy := get_node_or_null("ShadowMoth")
	if old_enemy:
		old_enemy.queue_free()
	_add_enemy()
	_update_level_text()
	prompt_label.text = ""

func _finish_game() -> void:
	game_finished = true
	var total: int = scores[0] + scores[1]
	var budget_grade := "熟練" if scores[0] >= 90 else "進步中"
	var risk_grade := "熟練" if scores[1] >= 90 else "進步中"
	result_text.text = "冒險完成！兩把鑰匙都到手了 ✨\n\n月光市集｜預算得分：%d（%s）\n星光樹屋｜分散風險得分：%d（%s）\n總得分：%d / 250\n\n你的進步：已會先分配收入、辨認必需與想要；\n也知道分散投資能降低單一標的風險，\n但投資仍有風險，沒有保證獲利。\n\n按 Esc 結束冒險。" % [scores[0], budget_grade, scores[1], risk_grade, total]
	result_panel.visible = true
	_update_hud()

func _update_level_text() -> void:
	var label := hud.get_node_or_null("PanelContainer/VBoxContainer/LevelLabel")
	if label:
		label.text = "第 %d 關｜%s" % [level, "月光市集・預算分配" if level == 1 else "星光樹屋・分散風險"]

func _update_hud() -> void:
	if score_label:
		score_label.text = "本關得分：%d　　鑰匙：%s" % [scores[level - 1], "✦ 已取得" if key_found else "尚未取得"]

func _add_sign(pos: Vector3) -> void:
	_box("Welcome sign", Vector3(0.18, 1.0, 0.18), pos + Vector3(0, -0.35, 0), Color("946f54"))
	var board := _box("Sign board", Vector3(1.5, 0.9, 0.2), pos + Vector3(0, 0.5, -0.08), Color("42686d"))
	board.rotation_degrees.z = -4

func _add_shrine(pos: Vector3) -> void:
	_box("Question pedestal", Vector3(1.3, 0.85, 0.8), pos, Color("6a5a78"))
	var gem := _sphere("Question star", pos + Vector3(0, 0.8, 0), 0.36, Color("ffd778"))
	var gem_mat := _material(Color("ffd778"))
	gem_mat.emission_enabled = true
	gem_mat.emission = Color("ffc44d")
	gem_mat.emission_energy_multiplier = 1.4
	gem.material_override = gem_mat

func _add_gate(pos: Vector3) -> void:
	_box("Gate left", Vector3(0.32, 2.7, 0.35), pos + Vector3(-0.9, 0, 0), Color("426d75"))
	_box("Gate right", Vector3(0.32, 2.7, 0.35), pos + Vector3(0.9, 0, 0), Color("426d75"))
	_box("Gate arch", Vector3(2.1, 0.32, 0.35), pos + Vector3(0, 1.18, 0), Color("d5a959"))
	for i in range(4):
		_box("Gate bars", Vector3(0.11, 1.7, 0.16), pos + Vector3(-0.6 + i * 0.4, 0, 0.1), Color("7fa6a1"))

func _add_enemy() -> void:
	var moth := Node3D.new()
	moth.name = "ShadowMoth"
	moth.position = Vector3(0.4, 0.9, 0.35)
	var body := _sphere("Moth body", Vector3.ZERO, 0.33, Color("766ab0"))
	body.scale = Vector3(1.0, 0.75, 0.6)
	_attach_to(body, moth)
	var left_wing := _sphere("Moth wing", Vector3(-0.4, 0.16, 0), 0.28, Color("ad9cdb"))
	left_wing.scale = Vector3(1.0, 0.6, 0.3)
	_attach_to(left_wing, moth)
	var right_wing := _sphere("Moth wing", Vector3(0.4, 0.16, 0), 0.28, Color("ad9cdb"))
	right_wing.scale = Vector3(1.0, 0.6, 0.3)
	_attach_to(right_wing, moth)
	add_child(moth)

func _attach_to(node: Node, parent: Node) -> void:
	var old_parent := node.get_parent()
	if old_parent:
		old_parent.remove_child(node)
	parent.add_child(node)

func _box(label: String, size: Vector3, pos: Vector3, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = pos
	node.material_override = _material(color)
	add_child(node)
	return node

func _sphere(label: String, pos: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 16
	mesh.rings = 8
	node.mesh = mesh
	node.position = pos
	node.material_override = _material(color)
	add_child(node)
	return node

func _material(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.72
	return mat

func _style_panel(panel: PanelContainer, fill: Color, edge: Color) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = edge
	style.set_border_width_all(2)
	style.set_corner_radius_all(16)
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 18
	style.content_margin_bottom = 18
	panel.add_theme_stylebox_override("panel", style)
