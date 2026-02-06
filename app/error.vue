<script setup>
definePageMeta({
  layout: 'empty'
})
import errorImage from './assets/images/404.svg?raw'
</script>

<template>
  <h1 class="text-4xl font-bold mb-2">MCAPPX版本库下载链接解析服务</h1>
  <h1 class="text-3xl font-bold mb-2">错误：无效链接</h1>
  <p class="text-gray-500 mb-6">抱歉，您访问的链接不存在，可能已失效或被删除。你可以点击下面的图片返回主页。</p>
  <a
    class="w-full h-full max-w-[600px] mx-auto flex items-center justify-center [&_svg]:w-full"
    href="/"
    v-html="errorImage"
  />
</template>
