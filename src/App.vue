<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-config-provider
        :theme="darkTheme"
        :locale="zhCN"
        :date-locale="dateZhCN"
        style="height: 100%; position: relative"
        :theme-overrides="themeOverrides"
      >
        <router-view />
      </n-config-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme, zhCN, dateZhCN } from 'naive-ui'

const themeOverrides = {
  common: {
    primaryColor: '#3d86d8',
  },
  Button: {
    textColorPrimary: '#fff',
    colorHoverPrimary: '#3d86d8',
    textColorHoverPrimary: '#fff',
    borderHoverPrimary: '#3d86d8',
    colorPressedPrimary: '#3d86d8',
    colorFocusPrimary: '#3d86d8',
    textColorPressedPrimary: '#fff',
    textColorFocusPrimary: '#fff',
    borderPressedPrimary: '#3d86d8',

    textColorInfo: '#fff',
    textColorPressedInfo: '#fff',
    textColorFocusInfo: '#fff',
    textColorHoverInfo: '#fff',

    textColorError: '#fff',
    textColorPressedError: '#fff',
    textColorFocusError: '#fff',
    textColorHoverError: '#fff',
  },
  Modal: {
    colorModal: '#18233c',
  },
  Card: {
    colorModal: '#18233c',
  },
  DataTable: {
    tdColor: '#18233c',
    tdColorHover: '#18233c',
    thColor: '#18233c',
  },
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
