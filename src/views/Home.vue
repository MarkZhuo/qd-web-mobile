<template>
  <div class="main">
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
              <n-button class="forward-back-btn" text-color="#3EA7FE" @click="handleBack"
                ><template #icon>
                  <n-icon>
                    <i class="iconfont icon-pause1"></i>
                  </n-icon> </template
                >后退10米</n-button
              >
              <n-button class="control-btn" color="#38A5FF" v-if="isPatrol" @click="handleControlNav"
                >开始导航</n-button
              >
              <n-button class="control-btn" color="#38A5FF" v-if="!isResume && isPause" @click="handlePauseNav"
                ><template #icon>
                  <n-icon>
                    <i class="iconfont icon-pause"></i>
                  </n-icon> </template
                >暂停导航</n-button
              >
              <n-button class="control-btn" color="#38A5FF" v-if="isResume && !isPause" @click="handleResumeNav"
                ><template #icon>
                  <n-icon>
                    <i class="iconfont icon-start"></i>
                  </n-icon> </template
                >继续导航</n-button
              >
              <n-button class="forward-back-btn" text-color="#3EA7FE" @click="handleForward"
                >前进10米<template #icon>
                  <n-icon>
                    <i class="iconfont icon-front"></i>
                  </n-icon> </template
              ></n-button>
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
import { NSlider, NSpace, NButton, NSelect, NIconWrapper, NIcon, NCheckbox, useMessage } from 'naive-ui'
import Sspx from '@soonspacejs/plugin-sspx'
import Soonmanager2SyncPlugin from '@soonspacejs/plugin-soonmanager2-sync'
import PatrolControlsPlugin from '@soonspacejs/plugin-patrol-controls'
import { More } from '@icon-park/vue-next'
import {
  Navigations,
  navLine_1,
  navLine_2,
  navLine_3,
  navLine_4,
  navLine_5,
  navLine_6,
  navLine_7,
  navLine_8,
  navLine_9,
} from './constant'

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
const query = ref('')
const manId = '549XO4ZWYKM7' // 男性人物
const femaleId = '549XO4ZWYKM6' // 女性人物
const SFCId = '549XO4ZRDWRQ' // 消防车

onMounted(() => {
  query.value = window.location.href
  console.log(query.value)
  ssp = Sspx.get('qdSsp')
  soonmanager2Sync = ssp.registerPlugin(Soonmanager2SyncPlugin, 'soonmanager2Sync')
  ssp.setModelDracoDecoderPath('/draco/')
  soonmanager2Sync.setPath('/soonspace')
  // soonmanager2Sync.setPath('https://jsafsss.oss-cn-beijing.aliyuncs.com/qdbim/soonspace')
  patrolControls.value = ssp.registerPlugin(PatrolControlsPlugin, 'patrolControls')
  soonmanager2Sync.fetchTreeData().then((treeData) => {
    console.log(treeData, 'treeData')
  })
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
    ssp.removeObjectById(manId)
    ssp.removeObjectById(femaleId)
    ssp.removeObjectById(SFCId)
  })
})

function sceneReady(ssp) {
  Sspx.add('qdSsp', ssp)
}

function handleModelClick(params) {
  console.log(params)
}

async function handleSelectArea(item) {
  if (item) {
    await ssp.clearTopology()
  }
  selectArea.value = item
  selectAreaId.value = item.id
  soonmanager2Sync.getTopologies().then((e) => {
    console.log(e)
    if (selectAreaId.value === '3-1') {
      ssp.createTopology({
        ...e[16],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[16].id)
    }
    if (selectAreaId.value === '4-3') {
      ssp.createTopology({
        ...e[9],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[9].id)
    }
    if (selectAreaId.value === '1-2') {
      ssp.createTopology({
        ...e[17],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[17].id)
    }
    if (selectAreaId.value === '2-2') {
      ssp.createTopology({
        ...e[12],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[12].id)
    }
    if (selectAreaId.value === '3-2') {
      ssp.createTopology({
        ...e[13],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[13].id)
    }
    if (selectAreaId.value === '2-1') {
      ssp.createTopology({
        ...e[10],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[10].id)
    }
    if (selectAreaId.value === '1-1') {
      ssp.createTopology({
        ...e[11],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[11].id)
    }
    if (selectAreaId.value === '4-1') {
      ssp.createTopology({
        ...e[14],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[14].id)
    }
    if (selectAreaId.value === '4-2') {
      ssp.createTopology({
        ...e[15],
        imgUrl: '/images/arrow_blue_up.svg',
        linkColor: '#F0F8FF',
        nodeColor: '#39A5FE',
        animation: true,
      })
      topologies.value = ssp.getObjectById(e[15].id)
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
    eyeHeight: 1.2,
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
        if (selectAreaId.value === '3-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node5') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node6') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node8') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node9') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node11') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node12') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node13') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node3') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
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
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node1') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node1') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node2') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node7') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node8') {
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
        if (selectAreaId.value === '3-1') {
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
        if (selectAreaId.value === '4-3') {
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
        if (selectAreaId.value === '1-2' || selectAreaId.value === '1-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 77.26781371046668,
              y: -7.868773536155063,
              z: -30.22374699312749,
            },
            target: {
              x: 77.20967850275078,
              y: -16.716745065481287,
              z: -8.77758337174611,
            },
          })
        }
        if (selectAreaId.value === '2-2' || selectAreaId.value === '2-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 146.7311307807873,
              y: -6.629035058102969,
              z: 17.166420615054292,
            },
            target: {
              x: 146.7199708958795,
              y: -6.754052595882955,
              z: 16.880693462498414,
            },
          })
        }
        if (selectAreaId.value === '3-2') {
          ssp.setCameraViewpoint({
            position: {
              x: 77.12294407237552,
              y: -7.26572023779007,
              z: 11.896577571182902,
            },
            target: {
              x: 76.42940581728298,
              y: -26.892953203855825,
              z: -26.282032903775246,
            },
          })
        }
        if (selectAreaId.value === '4-1' || selectAreaId.value === '4-2') {
          ssp.setCameraViewpoint({
            position: {
              x: 79.35992242678351,
              y: -13.289355465153603,
              z: -8.239116627542822,
            },
            target: {
              x: 114.94722111702492,
              y: -22.59626150789076,
              z: -9.629079583464932,
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
  // ssp.clearTopology()
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
        if (selectAreaId.value === '3-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node5') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node7') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node8') {
          guideDetail.value = ''
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node11') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-1' && nextNode.name === 'node12') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node3') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-3' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-2' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '3-2' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
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
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '2-1' && nextNode.name === 'node10') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node1') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node4') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node5') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node8') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '1-1' && nextNode.name === 'node9') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node1') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node2') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node6') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-1' && nextNode.name === 'node7') {
          guideDetail.value = `${parseInt(nextDistance)}米后 抵达目的地`
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node0') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node1') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node2') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node3') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node4') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node5') {
          guideDetail.value = `${parseInt(nextDistance)}米后 右转`
          markImg.value = '/images/turn_right.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node6') {
          guideDetail.value = `${parseInt(nextDistance)}米后 左转`
          markImg.value = '/images/turn_left.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node7') {
          guideDetail.value = ``
          markImg.value = '/images/forward.png'
        }
        if (selectAreaId.value === '4-2' && nextNode.name === 'node8') {
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
        if (selectAreaId.value === '3-1') {
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
        if (selectAreaId.value === '4-3') {
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
        if (selectAreaId.value === '1-2' || selectAreaId.value === '1-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 77.26781371046668,
              y: -7.868773536155063,
              z: -30.22374699312749,
            },
            target: {
              x: 77.20967850275078,
              y: -16.716745065481287,
              z: -8.77758337174611,
            },
          })
        }
        if (selectAreaId.value === '2-2' || selectAreaId.value === '2-1') {
          ssp.setCameraViewpoint({
            position: {
              x: 146.7311307807873,
              y: -6.629035058102969,
              z: 17.166420615054292,
            },
            target: {
              x: 146.7199708958795,
              y: -6.754052595882955,
              z: 16.880693462498414,
            },
          })
        }
        if (selectAreaId.value === '3-2') {
          ssp.setCameraViewpoint({
            position: {
              x: 77.12294407237552,
              y: -7.26572023779007,
              z: 11.896577571182902,
            },
            target: {
              x: 76.42940581728298,
              y: -26.892953203855825,
              z: -26.282032903775246,
            },
          })
        }
        if (selectAreaId.value === '4-1' || selectAreaId.value === '4-2') {
          ssp.setCameraViewpoint({
            position: {
              x: 79.35992242678351,
              y: -13.289355465153603,
              z: -8.239116627542822,
            },
            target: {
              x: 114.94722111702492,
              y: -22.59626150789076,
              z: -9.629079583464932,
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
    height: calc(100% - 185px);
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
        font-size: 15px;
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
        font-size: 14px;
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
          :deep(.n-space) {
            gap: 0 !important;
          }
          :deep(.control-btn) {
            background: linear-gradient(315deg, #38a5ff 0%, #98c9fa 100%);
            border-radius: 8px;
          }
          :deep(.forward-back-btn) {
            border-radius: 8px;
            border: 1px solid #3da7ff;
            .n-button__icon {
              margin-top: 1px;
              .icon-pause1 {
                font-size: 12px;
              }
              .icon-front {
                font-size: 12px;
              }
            }
          }
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
