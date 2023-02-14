<template>
  <div class="main">
    <!--    <div class="top">-->
    <!--      <span class="iconfont icon-guanbi" @click="showControlMode = false"></span>-->
    <!--      <span class="title">青岛智慧地铁室内导航</span>-->
    <!--      <span class="more">-->
    <!--        <more theme="outline" size="24" fill="#333" />-->
    <!--      </span>-->
    <!--    </div>-->
    <div class="nav-indoor" :class="{ hidden: !showControlMode }">
      <div class="top">
        <div class="title">室内导航</div>
        <div class="title">{{ selectArea?.name ?? '请选择您的目的地' }}</div>
      </div>
      <div class="components" v-for="item in Navigations" :key="item.id">
        <div class="components-name">{{ item.name }}</div>
        <div
          :class="{ active: selectAreaId === v?.id }"
          class="components-area"
          v-for="v in item?.areas"
          :key="v.id"
          @click="handleSelectArea(v)"
        >
          <div class="components-area-name">{{ v.name }}</div>
          <div class="components-area-checkbox" :class="{ bg: selectAreaId === v?.id }"></div>
        </div>
      </div>
      <div class="start-btn">
        <n-button @click="handleShowNav">开始导航</n-button>
      </div>
    </div>
    <div class="soonspace-area">
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
        @modelClick="handleModelClick"
      />
    </div>
    <div class="guide-container" v-show="showControlMode">
      <div class="content" v-show="showDetail">
        <div class="guide-mark">
          <img :src="markImg" />
        </div>
        <div class="guide-info">
          <div class="detail">直行</div>
          <div class="detail">{{ guideDetail }}</div>
        </div>
      </div>
    </div>
    <div class="control-container" v-show="showControlMode">
      <div class="content">
        <div class="position-info" @click="handleSelectPosition">
          <span class="icon-position"></span>
          <span class="position">{{ selectArea?.name }}</span>
          <span class="icon-arrow"></span>
        </div>
        <div class="control-area">
          <div class="slider">
            <n-slider
              v-model:value="sliderValue"
              :max="1"
              :step="step"
              :show-tooltip="showTooltip"
              :format-tooltip="formatTooltip"
              @update:value="handleUpdateSliderValue"
            >
              <template #thumb>
                <n-icon-wrapper :size="20" :border-radius="12">
                  <i class="iconfont icon-hangren"></i>
                </n-icon-wrapper>
              </template>
            </n-slider>
          </div>
          <div class="controller">
            <n-space justify="space-around">
              <n-button type="info" @click="handleBack">后退10米</n-button>
              <n-button type="info" v-if="isPatrol" @click="handleControlNav">开始导航</n-button>
              <n-button type="info" v-if="!isResume && isPause" @click="handlePauseNav">暂停导航</n-button>
              <n-button type="info" v-if="isResume && !isPause" @click="handleResumeNav">继续导航</n-button>
              <n-button type="info" @click="handleForward">前进10米</n-button>
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
import { onMounted, ref, reactive } from 'vue'
import { NSlider, NSpace, NButton, NSelect, NIconWrapper, NCheckbox, useMessage } from 'naive-ui'
import Sspx from '@soonspacejs/plugin-sspx'
import Soonmanager2SyncPlugin from '@soonspacejs/plugin-soonmanager2-sync'
import PatrolControlsPlugin from '@soonspacejs/plugin-patrol-controls'
import { More } from '@icon-park/vue-next'
import { Navigations } from './constant'

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
const sliderValue = ref(0)
const step = ref(0.0004)
const showControlMode = ref(false)
const selectArea = ref(null)
const selectAreaId = ref('')
const topologies = ref(null)
const patrolControls = ref(null)
const isPatrol = ref(true)
const isResume = ref(false)
const isPause = ref(false)
const patrol = reactive({
  patrolled: 0,
  percent: 0,
  total: 0,
})
const patrolInterval = 10
const showTooltip = ref(false)
const formatTooltip = (value) => {
  return `${parseInt(patrol.total) - parseInt(value * patrol.total) + 'm'}`
}
const guideDetail = ref('')
const showDetail = ref(false)
const markImg = ref('/images/forward.png')

onMounted(() => {
  ssp = Sspx.get('qdSsp')
  soonmanager2Sync = ssp.registerPlugin(Soonmanager2SyncPlugin, 'soonmanager2Sync')
  ssp.setModelDracoDecoderPath('/draco/')
  soonmanager2Sync.setPath('/soonspace')
  patrolControls.value = ssp.registerPlugin(PatrolControlsPlugin, 'patrolControls')
  /**
   * 加载场景
   */
  soonmanager2Sync.loadScene().then(async () => {
    ssp.setCameraViewpoint({
      position: {
        x: 225.74229823720415,
        y: 60.87413563881296,
        z: 65.89712489392214,
      },
      target: {
        x: 123.3114607041962,
        y: -17.744408502626086,
        z: -4.442003782465552,
      },
    })
    ssp.removeObjectById('4XCL3WN7HF4V')
    ssp.removeObjectById('4XCL3WN7HF4W')
  })
})

function sceneReady(ssp) {
  Sspx.add('qdSsp', ssp)
}

function handleModelClick(params) {
  console.log(params)
}

function handleSelectArea(item) {
  selectArea.value = item
  selectAreaId.value = item.id
  soonmanager2Sync.getTopologies().then((e) => {
    if (selectAreaId.value === '1-1') {
      ssp.createTopology(e[9])
      topologies.value = ssp.getObjectById(e[9].id)
    }
    if (selectAreaId.value === '2-1') {
      ssp.createTopology(e[8])
      topologies.value = ssp.getObjectById(e[8].id)
    }
  })
}

function handleShowNav() {
  if (!selectArea.value) {
    return message.warning('请选择室内导航区域！')
  }
  showControlMode.value = true

  showTooltip.value = true
  showDetail.value = true
  isPause.value = true
  isResume.value = false
  isPatrol.value = false
  let path = {}
  const options = {
    flyToStartPoint: true,
    eyeHeight: 1.7,
    naviSpeed: 0.003,
    rotateSpeed: 0.5,
  }
  path = topologies.value
  patrolControls.value.start(
    // path
    path,
    // options
    {
      ...options,
      onUpdate: (realTimePosition, realTimeRotation, nextNode, nextDistance) => {
        // console.log(nextNode)
        // console.log(nextDistance)
        if (selectAreaId.value === '1-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node5') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node7') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node8') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node11') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node12') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node3') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
      },
      onProgress: (params) => {
        // console.log(params)
        step.value = params.percent - patrol.percent
        patrol.patrolled = params.patrolled
        patrol.percent = params.percent
        patrol.total = params.total
        sliderValue.value = patrol.percent
      },
      onEnd: () => {
        message.info('导航结束！')
        patrolControls.value.stop()
        sliderValue.value = 0
        showTooltip.value = false
        showDetail.value = false
        isPause.value = false
        isResume.value = false
        isPatrol.value = true
        if (selectAreaId.value === '1-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 145.16795460335464,
              y: -7.22705417305863,
              z: -16.62881584338346,
            },
            target: {
              x: 126.3624828116591,
              y: -13.25869337658246,
              z: -14.258049285671024,
            },
          })
        }
        if (selectAreaId.value === '2-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 121.55973529311572,
              y: -13.064799292945526,
              z: -5.675493261625442,
            },
            target: {
              x: 122.04494405116866,
              y: -13.125915014003327,
              z: -5.753144619419772,
            },
          })
        }
      },
    },
  )
}

function handleSelectPosition() {
  showControlMode.value = false
  showTooltip.value = false
  showDetail.value = false
  isPause.value = false
  isResume.value = false
  isPatrol.value = true
  sliderValue.value = 0
  patrolControls.value.stop()
  ssp.clearTopology()
}

function handleControlNav() {
  showTooltip.value = true
  showDetail.value = true
  isPause.value = true
  isResume.value = false
  isPatrol.value = false
  let path = {}
  const options = {
    flyToStartPoint: true,
    eyeHeight: 1.7,
    naviSpeed: 0.003,
    rotateSpeed: 0.5,
  }
  path = topologies.value
  patrolControls.value.start(
    // path
    path,
    // options
    {
      ...options,
      onUpdate: (realTimePosition, realTimeRotation, nextNode, nextDistance) => {
        // console.log(nextNode)
        // console.log(nextDistance)
        if (selectAreaId.value === '1-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node5') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node7') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node8') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node11') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node12') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node3') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
      },
      onProgress: (params) => {
        // console.log(params)
        step.value = params.percent - patrol.percent
        patrol.patrolled = params.patrolled
        patrol.percent = params.percent
        patrol.total = params.total
        sliderValue.value = patrol.percent
      },
      onEnd: () => {
        message.info('导航结束！')
        patrolControls.value.stop()
        sliderValue.value = 0
        showTooltip.value = false
        showDetail.value = false
        isPause.value = false
        isResume.value = false
        isPatrol.value = true
        if (selectAreaId.value === '1-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 145.16795460335464,
              y: -7.22705417305863,
              z: -16.62881584338346,
            },
            target: {
              x: 126.3624828116591,
              y: -13.25869337658246,
              z: -14.258049285671024,
            },
          })
        }
        if (selectAreaId.value === '2-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 121.55973529311572,
              y: -13.064799292945526,
              z: -5.675493261625442,
            },
            target: {
              x: 122.04494405116866,
              y: -13.125915014003327,
              z: -5.753144619419772,
            },
          })
        }
      },
    },
  )
}

function handlePauseNav() {
  isPause.value = false
  isResume.value = true
  isPatrol.value = false
  patrolControls.value.pause()
}

function handleResumeNav() {
  isPause.value = true
  isResume.value = false
  isPatrol.value = false
  patrolControls.value.resume()
}

function handleForward() {
  patrolControls.value.setProgress(patrol.percent + patrolInterval / patrol.total)
}

function handleBack() {
  patrolControls.value.setProgress(patrol.percent - patrolInterval / patrol.total)
}

function handleUpdateSliderValue(val) {
  patrolControls.value.setProgress(val)
}
</script>

<style lang="scss" scoped>
.main {
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #dbedff 0%, #ffffff 45%, #ffffff 100%);
  > .top {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    .icon-guanbi {
      &:before {
        font-size: 12px;
      }
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      color: #000000;
    }
    .more {
      padding-top: 8px;
    }
  }
  .soonspace-area {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
  }
  .nav-indoor {
    width: 100%;
    height: 100%;
    position: absolute;
    padding: 0 20px;
    background: linear-gradient(180deg, #dbedff 0%, #ffffff 45%, #ffffff 100%);
    &.hidden {
      z-index: 99;
    }
    > .top {
      height: 80px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(42, 130, 228, 0.08);
      > .title {
        &:nth-child(1) {
          font-size: 14px;
          font-weight: bold;
          color: #000000;
        }
        &:nth-child(2) {
          font-size: 12px;
          font-weight: 400;
          color: #6b7e93;
        }
      }
    }
    .components {
      padding-top: 30px;
      &-name {
        font-size: 14px;
        font-weight: bold;
        color: #000000;
        position: relative;
        padding-left: 15px;
        &::before {
          content: '';
          display: block;
          width: 3px;
          height: 7px;
          background: #3a87eb;
          position: absolute;
          left: 8px;
          top: 7px;
        }
      }
      &-area {
        width: 100%;
        display: flex;
        height: 35px;
        align-items: center;
        font-size: 12px;
        padding: 0 10px;
        position: relative;
        &.active {
          background: rgba(163, 208, 255, 0.25);
        }
        .components-area-checkbox {
          position: absolute;
          right: 20px;
          width: 15px;
          height: 12px;
          &.bg {
            background: url('/public/images/tick.png') no-repeat;
            background-size: 100%;
          }
        }
      }
    }
    .start-btn {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 10%;
      :deep(.n-button) {
        width: 140px;
        height: 40px;
        background: linear-gradient(315deg, #38a5ff 0%, #98c9fa 100%);
      }
    }
  }
  .guide-container {
    position: absolute;
    opacity: 0.8;
    width: 100%;
    height: 84px;
    top: 0;
    padding: 10px;
    .content {
      width: 100%;
      height: 100%;
      background: #192234;
      border-radius: 13px;
      display: flex;
      .guide-mark {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 60px;
        img {
          width: 40px;
          height: 50px;
        }
      }
      .guide-info {
        width: calc(100% - 60px);
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: #ffffff;
      }
    }
  }
  .control-container {
    position: absolute;
    width: 100%;
    height: 185px;
    background: linear-gradient(180deg, #edf4fd 0%, #ffffff 100%);
    box-shadow: 0px 0px 10px 0px rgba(24, 42, 82, 0.5);
    border-radius: 13px 13px 0px 0px;
    bottom: 0;
    .content {
      position: relative;
      width: 100%;
      height: 100%;
      .position-info {
        position: absolute;
        left: 50%;
        top: 10%;
        transform: translateX(-50%);
        width: 336px;
        height: 35px;
        background: #fcfdff;
        box-shadow: 0px 1px 2px 0px rgba(195, 207, 226, 0.5);
        border-radius: 13px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 0 20px;
        .icon-position {
          width: 17px;
          height: 21px;
          background: url('/public/images/position.png') no-repeat;
          background-size: 100%;
        }
        .icon-arrow {
          width: 10px;
          height: 6px;
          background: url('/public/images/arrow.png') no-repeat;
          background-size: 100%;
          transform: rotate(-90deg);
        }
        //:deep(.n-select .n-base-selection) {
        //  --n-border-radius: 13px !important;
        //  box-shadow: 0px 1px 2px 0px rgba(195, 207, 226, 0.5);
        //  --n-border-active: none !important;
        //  --n-border-focus: none !important;
        //  --n-border-hover: none !important;
        //  --n-placeholder-color: none !important;
        //  --n-arrow-color: #000000 !important;
        //}
        //:deep(.n-select .n-base-selection .n-base-selection-label) {
        //  background-color: #fcfdff !important;
        //}
      }
      .control-area {
        position: absolute;
        width: 100%;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        .slider {
          :deep(.n-slider) {
            --n-rail-color: #dde5f0 !important;
            --n-rail-height: 9px !important;
            --n-fill-color: #38a5ff !important;
            --n-fill-color-hover: #38a5ff !important;
            --n-rail-color-hover: #dde5f0 !important;
            --n-handle-color: #39a6ff !important;
            .icon-hangren {
              color: #ffffff;
              font-size: 12px;
            }
          }
          :deep(.n-icon-wrapper) {
            box-shadow: 0px 2px 4px 0px rgba(79, 121, 168, 0.5) !important;
            border: 1px solid #ffffff !important;
          }
        }
        .controller {
          margin-top: 20px;
        }
      }
    }
  }
}
:deep(.n-slider-handle-indicator .n-slider-handle-indicator--top) {
  margin-bottom: 0 !important;
  --n-indicator-box-shadow: none !important;
  --n-indicator-color: none !important;
}
</style>
