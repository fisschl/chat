<script setup lang="ts">
import type { output as Output } from "zod/mini";
import { object, string } from "zod/mini";
import type { FormSubmitEvent } from "@nuxt/ui";
import { fetchError } from "~~/shared/utils/fetch";

const schema = object({
  loginText: string("用户名、邮箱或手机号不能为空"),
  password: string("密码不能为空"),
});

type Schema = Output<typeof schema>;

const state = reactive<Partial<Schema>>({
  loginText: undefined,
  password: undefined,
});

const toast = useToast();
const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true;
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: event.data,
    });
    toast.add({
      title: "登录成功",
      description: "欢迎回来！",
      color: "success",
    });
    // 登录成功后跳转到首页
    await navigateTo("/");
  } catch (error) {
    const message = fetchError(error);
    if (!message) return;
    toast.add({
      title: "登录失败",
      description: message,
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UContainer class="flex h-screen items-center justify-center">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="用户名、邮箱或手机号" name="loginText" required>
        <UInput v-model="state.loginText" icon="i-lucide-user" placeholder="请输入" />
      </UFormField>

      <UFormField label="密码" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          icon="i-lucide-lock"
          placeholder="请输入"
        />
      </UFormField>

      <UButton icon="i-lucide-send-horizontal" type="submit" :loading="isLoading"> 登录 </UButton>

      <div>
        <ULink class="text-sm" to="/register"> 还没有账号？立即注册 </ULink>
      </div>
    </UForm>
  </UContainer>
</template>
