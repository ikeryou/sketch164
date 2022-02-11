import vs from '../glsl/simple.vert';
import fs from '../glsl/item.frag';
import { MyObject3D } from "../webgl/myObject3D";
import { Util } from "../libs/util";
import { Mesh } from 'three/src/objects/Mesh';
import { FrontSide } from 'three/src/constants';
import { Func } from "../core/func";
import { Vector3 } from "three/src/math/Vector3";
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
import { Color } from 'three/src/math/Color';
import { Object3D } from "three/src/core/Object3D";
import { Conf } from "../core/conf";
import { Scroller } from "../core/scroller";
import { Val } from '../libs/val';

export class Item extends MyObject3D {

  private _mesh:Array<Object3D> = []
  private _id:number
  private _isBottom:boolean
  private _bomRate:Val
  private _bomNoise:Array<Vector3> = []

  public itemSize:Vector3 = new Vector3()

  constructor(opt:any = {}) {
    super()

    this._id = opt.id
    this._isBottom = opt.isBottom
    this._bomRate = opt.bomRate

    const geo = opt.geo
    const col = ~~(this._id / 3) % 2 == 0 ? opt.col[this._isBottom ? 0 : 1] : opt.col[this._isBottom ? 1 : 0]

    let num = this._isBottom ? 4 : 1
    for(let i = 0; i < num; i++) {
      const m = new Mesh(
        geo,
        new ShaderMaterial({
          vertexShader:vs,
          fragmentShader:fs,
          transparent:true,
          side:FrontSide,
          uniforms:{
            alpha:{value:1},
            color:{value:new Color(col)},
            addColRate:{value:0},
            addCol:{value:new Color(0xff0000)},
          }
        })
      )
      this.add(m)
      this._mesh.push(m)

      this._bomNoise.push(new Vector3(Util.instance.range(1), Util.instance.range(1), Util.instance.range(1)))
    }
    this.visible = false
  }


  // ---------------------------------
  // 更新
  // ---------------------------------
  protected _update():void {
    super._update()

    const sw = Func.instance.sw()
    const sh = Func.instance.sh()
    const baseSize = Func.instance.val(sw, sw * 0.4)
    const s = Scroller.instance.val.y
    const sr = (s) / (sh * Conf.instance.SCROLL_HEIGHT - sh)

    let test = sr >= Util.instance.map(this._id, 0, 1, 0, Conf.instance.ITEM_NUM - 1)
    if(!this._isBottom) {
        test = sr >= Util.instance.map(this._id, 1, 0, 0, Conf.instance.ITEM_NUM - 1)
    }
    this.visible = test

    // ひねる
    this.rotation.y = Util.instance.radian(Util.instance.map(sr, 0, 1, 0.5, 1) * this._id * 1)

    // 基本サイズ
    this.itemSize.x = baseSize * 0.5
    this.itemSize.y = Func.instance.val(5, 10)

    // すきま
    const offset = 10

    // 真ん中の
    const centerSize = sw * Func.instance.val(0.1, 0.04)
    let w = (this.itemSize.x - centerSize) * 0.5
    let h = this.itemSize.y

    if(this._isBottom) {
      this._mesh[0].scale.set(w, h, this.itemSize.x)
      this._mesh[0].position.x = this.itemSize.x * -0.5 + w * 0.5
      this._mesh[0].position.y = 0
      this._mesh[0].position.z = 0

      this._mesh[1].scale.set(this.itemSize.x - centerSize, h, w)
      this._mesh[1].position.z = this.itemSize.x * -0.5 + w * 0.5
      this._mesh[1].position.x = 0
      this._mesh[1].position.y = 0

      this._mesh[2].scale.set(w, h, this.itemSize.x)
      this._mesh[2].position.x = this.itemSize.x * 0.5 - w * 0.5
      this._mesh[2].position.y = 0
      this._mesh[2].position.z = 0

      this._mesh[3].scale.set(this.itemSize.x - centerSize, h, w)
      this._mesh[3].position.z = this.itemSize.x * 0.5 - w * 0.5
      this._mesh[3].position.x = 0
      this._mesh[3].position.y = 0

      // 爆発用に位置をずらす
      const bomRange = baseSize * 2 * this._bomRate.val
      const bomRot = 90 * this._bomRate.val
      const bomScale = Util.instance.mix(1, 0.01, this._bomRate.val)
      this._mesh.forEach((val, i) => {
        val.position.x += bomRange * this._bomNoise[i].x
        val.position.y += bomRange * this._bomNoise[i].y
        val.position.z += bomRange * this._bomNoise[i].z
        val.rotation.x = Util.instance.radian(bomRot * this._bomNoise[i].x)
        val.rotation.y = Util.instance.radian(bomRot * this._bomNoise[i].y)
        val.rotation.z = Util.instance.radian(bomRot * this._bomNoise[i].z)
        val.scale.multiplyScalar(bomScale)
        const uni = this._getUni(val)
        uni.addColRate.value = Util.instance.map(sr, 0, 1, 0.4, 0.5)
      })
    } else {
      this._mesh.forEach((val) => {
        val.scale.set(centerSize - offset, h, centerSize - offset)
        const uni = this._getUni(val)
        uni.addColRate.value = Util.instance.map(sr, 0, 1, 0.4, 0.5)
      })
    }
  }
}