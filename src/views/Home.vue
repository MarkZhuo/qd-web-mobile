<template>
  <div class="wrapper">
    <vue-soonspace
      id="selfId"
      className="selfClass"
      :customStyle="{
        width: '100%',
        height: '100%',
        backgroundSize: 'cover',
      }"
      :options="options"
      @sceneReady="sceneReady"
    />
  </div>
</template>

<script>
export default {
  name: 'Home',
}
</script>

<script setup>
import { onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import Sspx from '@soonspacejs/plugin-sspx'
import Soonmanager2SyncPlugin from '@soonspacejs/plugin-soonmanager2-sync'

const options = {
  // background: {
  //   img: '/images/BIM_bg/beam.png',
  //   alpha: false,
  // },
  // 是否显示渲染状态
  showStats: false,
  // 是否显示网格
  showGrid: false,
  // 是否显示左下角的加载数量信息
  showInfo: false,
  // 是否显示视图辅助器
  showViewHelper: false,
  // 控制器配置
  controls: {
    type: 'orbit',
    enableDamping: false, //阻尼效果
  },
}

let ssp = null
let soonmanager2Sync = null

const message = useMessage()

onMounted(() => {
  ssp = Sspx.get('qdSsp')
  soonmanager2Sync = ssp.registerPlugin(Soonmanager2SyncPlugin, 'soonmanager2Sync')
  ssp.setModelDracoDecoderPath('/draco/')
  soonmanager2Sync.setPath('/soonspace')
  /**
   * 加载场景
   */
  soonmanager2Sync.loadScene().then(async () => {
    ssp.setCameraViewpoint({
      position: {
        x: 145.43135804931595,
        y: -7.999194502021944,
        z: -5.210434395291186,
      },
      target: {
        x: 122.2770000025121,
        y: -15.761072591765675,
        z: -5.152366659103915,
      },
    })
    console.log('场景对象加载完成')
  })
})

function sceneReady(ssp) {
  Sspx.add('qdSsp', ssp)
}
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100vh;
}
</style>
