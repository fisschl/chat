<script setup lang="ts">
import type { output as Output } from "zod/mini";
import { object, string, optional } from "zod/mini";
import type { FormSubmitEvent } from "@nuxt/ui";
import { fetchError } from "~~/shared/utils/fetch";

const schema = object({
  userName: string("用户名不能为空"),
  email: optional(string()),
  phone: optional(string()),
  password: string("密码不能为空"),
});

type Schema = Output<typeof schema>;

const state = reactive<Partial<Schema>>({
  userName: undefined,
  email: undefined,
  phone: undefined,
  password: undefined,
});

const toast = useToast();
const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true;
  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: event.data,
    });

    toast.add({
      title: "注册成功",
      description: "账号已创建并自动登录！",
      color: "success",
    });

    // 注册成功后跳转到首页
    await navigateTo("/");
  } catch (error) {
    const message = fetchError(error);
    if (!message) return;

    toast.add({
      title: "注册失败",
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
      <UFormField label="用户名" name="userName" required>
        <UInput v-model="state.userName" icon="i-lucide-user" placeholder="请输入用户名" />
      </UFormField>

      <UFormField label="邮箱" name="email">
        <UInput v-model="state.email" icon="i-lucide-mail" placeholder="请输入邮箱（可选）" />
      </UFormField>

      <UFormField label="手机号" name="phone">
        <UInput v-model="state.phone" icon="i-lucide-phone" placeholder="请输入手机号（可选）" />
      </UFormField>

      <UFormField label="密码" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          icon="i-lucide-lock"
          placeholder="请输入密码"
        />
      </UFormField>

      <UButton icon="i-lucide-badge-plus" type="submit" :loading="isLoading"> 注册 </UButton>

      <div>
        <ULink class="text-sm" to="/login"> 已有账号？立即登录 </ULink>
      </div>
    </UForm>
  </UContainer>
</template>
