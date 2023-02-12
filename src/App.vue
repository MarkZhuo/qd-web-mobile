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
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
