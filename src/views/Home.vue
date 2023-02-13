<template>
  <div class="main">
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
    <div class="guide-container">
      <div class="content">
        <div class="guide-mark"></div>
        <div class="guide-info">
          <div class="detail">直行</div>
          <div class="detail">20米后 右转</div>
        </div>
      </div>
    </div>
    <div class="control-container">
      <div class="content">
        <div class="position-info"></div>
        <div class="control-area">
          <div class="slider">
            <n-slider v-model:value="sliderValue" :step="10" />
          </div>
          <div class="controller">
            <n-space justify="space-around">
              <n-button type="info">后退10米</n-button>
              <n-button type="info">开始导航</n-button>
              <n-button type="info">前进10米</n-button>
            </n-space>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
}
</script>

<script setup>
import { onMounted, ref } from 'vue'
import { NSlider, NSpace, NButton, useMessage } from 'naive-ui'
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
const sliderValue = ref(50)

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
.main {
  width: 100%;
  height: 100vh;
  .guide-container {
    position: absolute;
    width: 100%;
    height: 2rem;
    top: 0;
    opacity: 0.7;
    padding: 0.2rem;
    .content {
      width: 100%;
      height: 100%;
      background: #cccccc;
      display: flex;
      .guide-mark {
        width: 1.5rem;
        background: skyblue;
      }
      .guide-info {
        width: calc(100% - 1.5rem);
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        color: #000000;
        font-size: 0.3rem;
        font-weight: bold;
      }
    }
  }
  .control-container {
    position: absolute;
    width: 100%;
    height: 3rem;
    background: #ccc;
    bottom: 0;
    .content {
      position: relative;
      width: 100%;
      height: 100%;
      .control-area {
        position: absolute;
        width: 100%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 0.2rem;
        .controller {
          margin-top: 0.2rem;
        }
      }
    }
  }
}
</style>
