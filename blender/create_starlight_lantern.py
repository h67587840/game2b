import bpy
import math
from mathutils import Vector

# Original, child-friendly low-poly prop for the Godot adventure.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.0, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = 0.32
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*color, 1.0)
        bsdf.inputs['Emission Strength'].default_value = emission
    return mat

gold = material('Moonlit brass', (0.92, 0.55, 0.16), 0.7)
dark = material('Deep teal enamel', (0.035, 0.20, 0.24), 0.35)
glass = material('Starlight glass', (0.25, 0.88, 0.92), 0.1, 2.5)
cream = material('Warm ivory', (1.0, 0.82, 0.46), 0.0, 1.3)

def uv(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.shade_flat()
    return obj

def cyl(name, loc, radius, depth, mat, vertices=12, bevel=0.04):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft crafted edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj

# A stout little lantern, centered at the origin; its base rests on Z=0.
cyl('Lantern foot', (0, 0, 0.12), 0.55, 0.22, gold)
cyl('Enamel body', (0, 0, 0.67), 0.43, 0.95, dark)
cyl('Glass chamber', (0, 0, 0.68), 0.34, 0.64, glass, 10, 0.015)
cyl('Lantern crown', (0, 0, 1.20), 0.55, 0.18, gold)
uv('Floating star', (0, 0, 0.72), (0.20, 0.20, 0.27), cream)
cyl('Lantern cap', (0, 0, 1.36), 0.20, 0.16, gold)

# Curved-looking handle assembled from small brass links.
for i in range(9):
    angle = math.pi * i / 8
    x = 0.38 * math.cos(angle)
    z = 1.43 + 0.48 * math.sin(angle)
    bead = uv('Handle link', (x, 0, z), (0.075, 0.075, 0.09), gold)

# Decorative coin medallion and star inlay on the front (negative Y is front).
medallion = cyl('Savings medallion', (0, -0.445, 0.70), 0.16, 0.045, gold, 10, 0.01)
medallion.rotation_euler[0] = math.pi / 2
star = uv('Medallion star', (0, -0.478, 0.70), (0.085, 0.035, 0.085), cream)

# Set origin/scale convenient for an in-game prop.
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.context.view_layer.objects.active = bpy.context.scene.objects.get('Enamel body')

import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
for relative in ('assets/starlight_lantern.glb', 'godot/assets/starlight_lantern.glb'):
    out = os.path.join(project_root, relative)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True)
    print('EXPORTED', out)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(__file__), 'starlight_lantern.blend'))
