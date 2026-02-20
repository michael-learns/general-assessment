import { a as _sfc_main$5, _ as _sfc_main$7, u as useFormField, e as useComponentIcons, t as tv, g as _sfc_main$3$1, l as looseToNumber } from './Button-DBQu6OuW.mjs';
import { _ as _sfc_main$4 } from './Badge-zNc4Ede2.mjs';
import { defineComponent, ref, watch, nextTick, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, isRef, readonly, useSlots, computed, useTemplateRef, renderSlot, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderStyle, ssrRenderSlot, ssrRenderClass } from 'vue/server-renderer';
import { _ as _sfc_main$6 } from './Alert-BLQY_En5.mjs';
import { Primitive } from 'reka-ui';
import { useVModel } from '@vueuse/core';
import { e as useRoute, c as useState, b as useSeoMeta, n as navigateTo, a as useAppConfig, _ as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';
import 'tailwind-variants';
import './index-CnueD9va.mjs';
import '@iconify/vue';
import '@iconify/utils/lib/css/icon';
import 'perfect-debounce';
import './nuxt-link-C6CuK7rg.mjs';
import 'vue-router';
import 'tailwindcss/colors';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "MessageBubble",
  __ssrInlineRender: true,
  props: {
    role: {},
    content: {},
    isStreaming: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["flex gap-3", __props.role === "user" ? "justify-end" : "justify-start"]
      }, _attrs))}>`);
      if (__props.role !== "user") {
        _push(`<div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-1">`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-bot",
          class: "text-white w-4 h-4"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([__props.role === "user" ? "bg-primary-500 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm", "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"])}"><p class="whitespace-pre-wrap">${ssrInterpolate(__props.content)}</p>`);
      if (__props.isStreaming) {
        _push(`<span class="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.role === "user") {
        _push(`<div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-1">`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-user",
          class: "w-4 h-4"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MessageBubble.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "MessageBubble" });
const theme = {
  "slots": {
    "root": "relative inline-flex items-center",
    "base": [
      "w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75",
      "transition-colors"
    ],
    "leading": "absolute start-0 flex items-start",
    "leadingIcon": "shrink-0 text-dimmed",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "trailing": "absolute end-0 flex items-start",
    "trailingIcon": "shrink-0 text-dimmed"
  },
  "variants": {
    "fieldGroup": {
      "horizontal": {
        "root": "group has-focus-visible:z-[1]",
        "base": "group-not-only:group-first:rounded-e-none group-not-only:group-last:rounded-s-none group-not-last:group-not-first:rounded-none"
      },
      "vertical": {
        "root": "group has-focus-visible:z-[1]",
        "base": "group-not-only:group-first:rounded-b-none group-not-only:group-last:rounded-t-none group-not-last:group-not-first:rounded-none"
      }
    },
    "size": {
      "xs": {
        "base": "px-2 py-1 text-xs gap-1",
        "leading": "ps-2 inset-y-1",
        "trailing": "pe-2 inset-y-1",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-4"
      },
      "sm": {
        "base": "px-2.5 py-1.5 text-xs gap-1.5",
        "leading": "ps-2.5 inset-y-1.5",
        "trailing": "pe-2.5 inset-y-1.5",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-4"
      },
      "md": {
        "base": "px-2.5 py-1.5 text-sm gap-1.5",
        "leading": "ps-2.5 inset-y-1.5",
        "trailing": "pe-2.5 inset-y-1.5",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-5"
      },
      "lg": {
        "base": "px-3 py-2 text-sm gap-2",
        "leading": "ps-3 inset-y-2",
        "trailing": "pe-3 inset-y-2",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-5"
      },
      "xl": {
        "base": "px-3 py-2 text-base gap-2",
        "leading": "ps-3 inset-y-2",
        "trailing": "pe-3 inset-y-2",
        "leadingIcon": "size-6",
        "leadingAvatarSize": "xs",
        "trailingIcon": "size-6"
      }
    },
    "variant": {
      "outline": "text-highlighted bg-default ring ring-inset ring-accented",
      "soft": "text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50",
      "subtle": "text-highlighted bg-elevated ring ring-inset ring-accented",
      "ghost": "text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent",
      "none": "text-highlighted bg-transparent"
    },
    "color": {
      "primary": "",
      "secondary": "",
      "success": "",
      "info": "",
      "warning": "",
      "error": "",
      "neutral": ""
    },
    "leading": {
      "true": ""
    },
    "trailing": {
      "true": ""
    },
    "loading": {
      "true": ""
    },
    "highlight": {
      "true": ""
    },
    "type": {
      "file": "file:me-1.5 file:font-medium file:text-muted file:outline-none"
    },
    "autoresize": {
      "true": {
        "base": "resize-none"
      }
    }
  },
  "compoundVariants": [
    {
      "color": "primary",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
    },
    {
      "color": "secondary",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
    },
    {
      "color": "success",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success"
    },
    {
      "color": "info",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info"
    },
    {
      "color": "warning",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning"
    },
    {
      "color": "error",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error"
    },
    {
      "color": "primary",
      "highlight": true,
      "class": "ring ring-inset ring-primary"
    },
    {
      "color": "secondary",
      "highlight": true,
      "class": "ring ring-inset ring-secondary"
    },
    {
      "color": "success",
      "highlight": true,
      "class": "ring ring-inset ring-success"
    },
    {
      "color": "info",
      "highlight": true,
      "class": "ring ring-inset ring-info"
    },
    {
      "color": "warning",
      "highlight": true,
      "class": "ring ring-inset ring-warning"
    },
    {
      "color": "error",
      "highlight": true,
      "class": "ring ring-inset ring-error"
    },
    {
      "color": "neutral",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted"
    },
    {
      "color": "neutral",
      "highlight": true,
      "class": "ring ring-inset ring-inverted"
    },
    {
      "leading": true,
      "size": "xs",
      "class": "ps-7"
    },
    {
      "leading": true,
      "size": "sm",
      "class": "ps-8"
    },
    {
      "leading": true,
      "size": "md",
      "class": "ps-9"
    },
    {
      "leading": true,
      "size": "lg",
      "class": "ps-10"
    },
    {
      "leading": true,
      "size": "xl",
      "class": "ps-11"
    },
    {
      "trailing": true,
      "size": "xs",
      "class": "pe-7"
    },
    {
      "trailing": true,
      "size": "sm",
      "class": "pe-8"
    },
    {
      "trailing": true,
      "size": "md",
      "class": "pe-9"
    },
    {
      "trailing": true,
      "size": "lg",
      "class": "pe-10"
    },
    {
      "trailing": true,
      "size": "xl",
      "class": "pe-11"
    },
    {
      "loading": true,
      "leading": true,
      "class": {
        "leadingIcon": "animate-spin"
      }
    },
    {
      "loading": true,
      "leading": false,
      "trailing": true,
      "class": {
        "trailingIcon": "animate-spin"
      }
    }
  ],
  "defaultVariants": {
    "size": "md",
    "color": "primary",
    "variant": "outline"
  }
};
const _sfc_main$2 = /* @__PURE__ */ Object.assign({ inheritAttrs: false }, {
  __name: "UTextarea",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    id: { type: String, required: false },
    name: { type: String, required: false },
    placeholder: { type: String, required: false },
    color: { type: null, required: false },
    variant: { type: null, required: false },
    size: { type: null, required: false },
    required: { type: Boolean, required: false },
    autofocus: { type: Boolean, required: false },
    autofocusDelay: { type: Number, required: false, default: 0 },
    autoresize: { type: Boolean, required: false },
    autoresizeDelay: { type: Number, required: false, default: 0 },
    disabled: { type: Boolean, required: false },
    rows: { type: Number, required: false, default: 3 },
    maxrows: { type: Number, required: false, default: 0 },
    highlight: { type: Boolean, required: false },
    modelValue: { type: null, required: false },
    defaultValue: { type: null, required: false },
    modelModifiers: { type: Object, required: false },
    class: { type: null, required: false },
    ui: { type: null, required: false },
    icon: { type: null, required: false },
    avatar: { type: Object, required: false },
    leading: { type: Boolean, required: false },
    leadingIcon: { type: null, required: false },
    trailing: { type: Boolean, required: false },
    trailingIcon: { type: null, required: false },
    loading: { type: Boolean, required: false },
    loadingIcon: { type: null, required: false }
  },
  emits: ["update:modelValue", "blur", "change"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const slots = useSlots();
    const modelValue = useVModel(props, "modelValue", emits, { defaultValue: props.defaultValue });
    const appConfig = useAppConfig();
    const { emitFormFocus, emitFormBlur, emitFormInput, emitFormChange, size, color, id, name, highlight, disabled, ariaAttrs } = useFormField(props, { deferInputValidation: true });
    const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(props);
    const ui = computed(() => tv({ extend: tv(theme), ...appConfig.ui?.textarea || {} })({
      color: color.value,
      variant: props.variant,
      size: size?.value,
      loading: props.loading,
      highlight: highlight.value,
      autoresize: props.autoresize,
      leading: isLeading.value || !!props.avatar || !!slots.leading,
      trailing: isTrailing.value || !!slots.trailing
    }));
    const textareaRef = useTemplateRef("textareaRef");
    function updateInput(value) {
      if (props.modelModifiers?.trim) {
        value = value?.trim() ?? null;
      }
      if (props.modelModifiers?.number) {
        value = looseToNumber(value);
      }
      if (props.modelModifiers?.nullable) {
        value ||= null;
      }
      if (props.modelModifiers?.optional) {
        value ||= void 0;
      }
      modelValue.value = value;
      emitFormInput();
    }
    function onInput(event) {
      autoResize();
      if (!props.modelModifiers?.lazy) {
        updateInput(event.target.value);
      }
    }
    function onChange(event) {
      const value = event.target.value;
      if (props.modelModifiers?.lazy) {
        updateInput(value);
      }
      if (props.modelModifiers?.trim) {
        event.target.value = value.trim();
      }
      emitFormChange();
      emits("change", event);
    }
    function onBlur(event) {
      emitFormBlur();
      emits("blur", event);
    }
    function autoResize() {
      if (props.autoresize && textareaRef.value) {
        textareaRef.value.rows = props.rows;
        const overflow = textareaRef.value.style.overflow;
        textareaRef.value.style.overflow = "hidden";
        const styles = (void 0).getComputedStyle(textareaRef.value);
        const paddingTop = Number.parseInt(styles.paddingTop);
        const paddingBottom = Number.parseInt(styles.paddingBottom);
        const padding = paddingTop + paddingBottom;
        const lineHeight = Number.parseInt(styles.lineHeight);
        const { scrollHeight } = textareaRef.value;
        const newRows = (scrollHeight - padding) / lineHeight;
        if (newRows > props.rows) {
          textareaRef.value.rows = props.maxrows ? Math.min(newRows, props.maxrows) : newRows;
        }
        textareaRef.value.style.overflow = overflow;
      }
    }
    watch(modelValue, () => {
      nextTick(autoResize);
    });
    __expose({
      textareaRef
    });
    return (_ctx, _push, _parent, _attrs) => {
      let _temp0;
      _push(ssrRenderComponent(unref(Primitive), mergeProps({
        as: __props.as,
        "data-slot": "root",
        class: ui.value.root({ class: [props.ui?.root, props.class] })
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<textarea${ssrRenderAttrs(_temp0 = mergeProps({
              id: unref(id),
              ref_key: "textareaRef",
              ref: textareaRef,
              value: unref(modelValue),
              name: unref(name),
              rows: __props.rows,
              placeholder: __props.placeholder,
              "data-slot": "base",
              class: ui.value.base({ class: props.ui?.base }),
              disabled: unref(disabled),
              required: __props.required
            }, { ..._ctx.$attrs, ...unref(ariaAttrs) }), "textarea")}${_scopeId}>${ssrInterpolate("value" in _temp0 ? _temp0.value : "")}</textarea>`);
            ssrRenderSlot(_ctx.$slots, "default", { ui: ui.value }, null, _push2, _parent2, _scopeId);
            if (unref(isLeading) || !!__props.avatar || !!slots.leading) {
              _push2(`<span data-slot="leading" class="${ssrRenderClass(ui.value.leading({ class: props.ui?.leading }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "leading", { ui: ui.value }, () => {
                if (unref(isLeading) && unref(leadingIconName)) {
                  _push2(ssrRenderComponent(_sfc_main$5, {
                    name: unref(leadingIconName),
                    "data-slot": "leadingIcon",
                    class: ui.value.leadingIcon({ class: props.ui?.leadingIcon })
                  }, null, _parent2, _scopeId));
                } else if (!!__props.avatar) {
                  _push2(ssrRenderComponent(_sfc_main$3$1, mergeProps({
                    size: props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                  }, __props.avatar, {
                    "data-slot": "leadingAvatar",
                    class: ui.value.leadingAvatar({ class: props.ui?.leadingAvatar })
                  }), null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
              }, _push2, _parent2, _scopeId);
              _push2(`</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(isTrailing) || !!slots.trailing) {
              _push2(`<span data-slot="trailing" class="${ssrRenderClass(ui.value.trailing({ class: props.ui?.trailing }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "trailing", { ui: ui.value }, () => {
                if (unref(trailingIconName)) {
                  _push2(ssrRenderComponent(_sfc_main$5, {
                    name: unref(trailingIconName),
                    "data-slot": "trailingIcon",
                    class: ui.value.trailingIcon({ class: props.ui?.trailingIcon })
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
              }, _push2, _parent2, _scopeId);
              _push2(`</span>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("textarea", mergeProps({
                id: unref(id),
                ref_key: "textareaRef",
                ref: textareaRef,
                value: unref(modelValue),
                name: unref(name),
                rows: __props.rows,
                placeholder: __props.placeholder,
                "data-slot": "base",
                class: ui.value.base({ class: props.ui?.base }),
                disabled: unref(disabled),
                required: __props.required
              }, { ..._ctx.$attrs, ...unref(ariaAttrs) }, {
                onInput,
                onBlur,
                onChange,
                onFocus: unref(emitFormFocus)
              }), null, 16, ["id", "value", "name", "rows", "placeholder", "disabled", "required", "onFocus"]),
              renderSlot(_ctx.$slots, "default", { ui: ui.value }),
              unref(isLeading) || !!__props.avatar || !!slots.leading ? (openBlock(), createBlock("span", {
                key: 0,
                "data-slot": "leading",
                class: ui.value.leading({ class: props.ui?.leading })
              }, [
                renderSlot(_ctx.$slots, "leading", { ui: ui.value }, () => [
                  unref(isLeading) && unref(leadingIconName) ? (openBlock(), createBlock(_sfc_main$5, {
                    key: 0,
                    name: unref(leadingIconName),
                    "data-slot": "leadingIcon",
                    class: ui.value.leadingIcon({ class: props.ui?.leadingIcon })
                  }, null, 8, ["name", "class"])) : !!__props.avatar ? (openBlock(), createBlock(_sfc_main$3$1, mergeProps({
                    key: 1,
                    size: props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                  }, __props.avatar, {
                    "data-slot": "leadingAvatar",
                    class: ui.value.leadingAvatar({ class: props.ui?.leadingAvatar })
                  }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                ])
              ], 2)) : createCommentVNode("", true),
              unref(isTrailing) || !!slots.trailing ? (openBlock(), createBlock("span", {
                key: 1,
                "data-slot": "trailing",
                class: ui.value.trailing({ class: props.ui?.trailing })
              }, [
                renderSlot(_ctx.$slots, "trailing", { ui: ui.value }, () => [
                  unref(trailingIconName) ? (openBlock(), createBlock(_sfc_main$5, {
                    key: 0,
                    name: unref(trailingIconName),
                    "data-slot": "trailingIcon",
                    class: ui.value.trailingIcon({ class: props.ui?.trailingIcon })
                  }, null, 8, ["name", "class"])) : createCommentVNode("", true)
                ])
              ], 2)) : createCommentVNode("", true)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/@nuxt/ui/dist/runtime/components/Textarea.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const TOPIC_MAP = [
  {
    name: "Company Overview",
    requiredQuestions: [
      "How many employees does your company have?",
      "What industry or sector are you in?",
      "Do you operate under multiple legal entities or companies?",
      "Which countries or regions do you operate in?"
    ],
    codealiveSearchHints: ["multi-entity", "multi-country", "company setup"]
  },
  {
    name: "Pay Structure",
    requiredQuestions: [
      "What pay frequencies do you use (weekly, bi-weekly, monthly, or mixed)?",
      "Do you have a mix of salaried, hourly, commission-based, or contractor employees?",
      "How do you handle overtime — fixed multiplier or custom rules?",
      "Do any employees have multiple pay rates or split pay?",
      "Are there shift differentials or special pay premiums?"
    ],
    codealiveSearchHints: ["pay frequency", "overtime", "salary", "hourly", "commission", "split pay", "shift differential"]
  },
  {
    name: "Leave & Benefits",
    requiredQuestions: [
      "What leave types do you offer (annual, sick, maternity/paternity, unpaid)?",
      "How does leave accrual work — is it time-based, tenure-based, or policy-based?",
      "What benefits deductions do you manage through payroll (medical, pension, insurance)?",
      "Do you provide allowances such as travel, housing, or meal allowances?"
    ],
    codealiveSearchHints: ["leave management", "leave accrual", "benefits deduction", "allowances"]
  },
  {
    name: "Compliance & Tax",
    requiredQuestions: [
      "What are your primary tax filing requirements?",
      "Which statutory contributions apply to your employees (e.g. SSS, PhilHealth, HDMF, CPF, EPF)?",
      "Are there any government-mandated benefits or contributions unique to your region?",
      "Are any of your employees covered by union agreements or collective bargaining agreements?"
    ],
    codealiveSearchHints: ["tax filing", "statutory contributions", "SSS", "PhilHealth", "HDMF", "CPF", "EPF", "union", "CBA"]
  },
  {
    name: "Edge Cases & Special Policies",
    requiredQuestions: [
      "How do you handle mid-period hires or terminations?",
      "What are your final pay computation rules?",
      "Do you ever need retroactive pay adjustments?",
      "Do you run off-cycle payroll for any reason?",
      "Do you pay employees in multiple currencies?"
    ],
    codealiveSearchHints: ["proration", "final pay", "retroactive pay", "off-cycle", "multi-currency"]
  },
  {
    name: "Summary",
    requiredQuestions: [],
    codealiveSearchHints: []
  }
];
function getSectionNames() {
  return TOPIC_MAP.map((s) => s.name);
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ProgressPanel",
  __ssrInlineRender: true,
  props: {
    currentSection: {},
    completedSections: {},
    isCheckingFeature: { type: Boolean }
  },
  setup(__props) {
    const sections = getSectionNames();
    function getStatus(section, currentSection, completedSections) {
      if (completedSections.includes(section)) return "completed";
      if (section === currentSection) return "active";
      return "pending";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-3" }, _attrs))} data-v-04a62e10><h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider" data-v-04a62e10> Assessment Progress </h2><div class="space-y-1" data-v-04a62e10><!--[-->`);
      ssrRenderList(unref(sections), (section) => {
        _push(`<div class="${ssrRenderClass([{
          "bg-primary-50 dark:bg-primary-950/50": getStatus(section, __props.currentSection, __props.completedSections) === "active",
          "opacity-40": getStatus(section, __props.currentSection, __props.completedSections) === "pending"
        }, "flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200"])}" data-v-04a62e10><div class="w-5 h-5 shrink-0 flex items-center justify-center" data-v-04a62e10>`);
        if (getStatus(section, __props.currentSection, __props.completedSections) === "completed") {
          _push(ssrRenderComponent(_component_UIcon, {
            name: "i-lucide-check-circle-2",
            class: "text-green-500 w-5 h-5"
          }, null, _parent));
        } else if (getStatus(section, __props.currentSection, __props.completedSections) === "active") {
          _push(`<div class="w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-200 dark:ring-primary-800" data-v-04a62e10></div>`);
        } else {
          _push(`<div class="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600" data-v-04a62e10></div>`);
        }
        _push(`</div><span class="${ssrRenderClass([getStatus(section, __props.currentSection, __props.completedSections) === "active" ? "font-semibold text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300", "text-sm transition-all"])}" data-v-04a62e10>${ssrInterpolate(section)}</span></div>`);
      });
      _push(`<!--]--></div>`);
      if (__props.isCheckingFeature) {
        _push(`<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800" data-v-04a62e10>`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-search",
          class: "w-3 h-3 animate-pulse text-primary-400"
        }, null, _parent));
        _push(`<span data-v-04a62e10>Checking feature support...</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ProgressPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-04a62e10"]]), { __name: "ProgressPanel" });
function parseAssessmentBlock(content) {
  const match = content.match(/```assessment\r?\n([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!Array.isArray(parsed.sections) || typeof parsed.overallFitScore !== "number" || typeof parsed.summary !== "string" || typeof parsed.recommendations !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
function useChat(sessionId, companyName, industry) {
  const messages = ref([]);
  const isStreaming = ref(false);
  const isCheckingFeature = ref(false);
  const streamingContent = ref("");
  const error = ref("");
  async function sendMessage(userMessage) {
    if (!userMessage.trim() || isStreaming.value) return;
    messages.value.push({
      role: "user",
      content: userMessage,
      timestamp: Date.now()
    });
    isStreaming.value = true;
    streamingContent.value = "";
    error.value = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          companyName,
          industry,
          // Send all messages except the one just added (it's sent as userMessage)
          messages: messages.value.slice(0, -1),
          userMessage
        })
      });
      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              streamingContent.value += data.content;
            } else if (data.type === "tool_call") {
              isCheckingFeature.value = true;
            } else if (data.type === "done") {
              isCheckingFeature.value = false;
              if (streamingContent.value) {
                messages.value.push({
                  role: "model",
                  content: streamingContent.value,
                  timestamp: Date.now()
                });
                streamingContent.value = "";
              }
            } else if (data.type === "error") {
              error.value = data.message;
            }
          } catch {
          }
        }
      }
    } catch (err) {
      error.value = "Connection error. Please try again.";
      console.error("[useChat] fetch error:", err);
    } finally {
      isStreaming.value = false;
      isCheckingFeature.value = false;
      streamingContent.value = "";
    }
  }
  return {
    messages: readonly(messages),
    isStreaming: readonly(isStreaming),
    isCheckingFeature: readonly(isCheckingFeature),
    streamingContent: readonly(streamingContent),
    error,
    sendMessage
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[sessionId]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const sessionId = route.params.sessionId;
    const companyName = useState("companyName", () => "");
    const industry = useState("industry", () => "");
    const {
      messages,
      isStreaming,
      isCheckingFeature,
      streamingContent,
      error,
      sendMessage
    } = useChat(sessionId, companyName.value, industry.value);
    const inputMessage = ref("");
    const messagesContainer = ref();
    const currentSection = ref("Company Overview");
    const completedSections = ref([]);
    const isFinalizing = ref(false);
    useSeoMeta({ title: "Assessment in Progress — Payroll Fit" });
    watch([messages, streamingContent], async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    }, { deep: true });
    watch(messages, (newMessages) => {
      const aiMessages = [...newMessages].filter((m) => m.role === "model");
      const lastAi = aiMessages[aiMessages.length - 1];
      if (!lastAi) return;
      const assessment = parseAssessmentBlock(lastAi.content);
      if (assessment && !isFinalizing.value) {
        finalizeAssessment(lastAi.content);
        return;
      }
      const sectionNames = getSectionNames();
      for (const section of sectionNames) {
        if (lastAi.content.toLowerCase().includes(section.toLowerCase()) && section !== currentSection.value && !completedSections.value.includes(section)) {
          if (!completedSections.value.includes(currentSection.value)) {
            completedSections.value = [...completedSections.value, currentSection.value];
          }
          currentSection.value = section;
          break;
        }
      }
    }, { deep: true });
    async function handleSend() {
      if (!inputMessage.value.trim() || isStreaming.value) return;
      const msg = inputMessage.value.trim();
      inputMessage.value = "";
      await sendMessage(msg);
    }
    async function finalizeAssessment(lastMessage) {
      isFinalizing.value = true;
      try {
        await $fetch("/api/assessment/finalize", {
          method: "POST",
          body: {
            sessionId,
            lastAssistantMessage: lastMessage,
            companyName: companyName.value,
            industry: industry.value
          }
        });
        await navigateTo(`/report/${sessionId}`);
      } catch (err) {
        console.error("Failed to finalize assessment:", err);
        isFinalizing.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UIcon = _sfc_main$5;
      const _component_UBadge = _sfc_main$4;
      const _component_MessageBubble = __nuxt_component_2;
      const _component_UAlert = _sfc_main$6;
      const _component_UTextarea = _sfc_main$2;
      const _component_UButton = _sfc_main$7;
      const _component_ProgressPanel = __nuxt_component_6;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-screen flex flex-col overflow-hidden" }, _attrs))}><header class="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">`);
      _push(ssrRenderComponent(_component_UIcon, {
        name: "i-lucide-brain-circuit",
        class: "text-primary-500 w-5 h-5"
      }, null, _parent));
      _push(`<span class="font-semibold text-sm">Payroll Fit Assessment</span>`);
      if (unref(companyName)) {
        _push(ssrRenderComponent(_component_UBadge, {
          variant: "subtle",
          color: "primary",
          size: "sm"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(companyName))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(companyName)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="ml-auto">`);
      if (unref(isFinalizing)) {
        _push(ssrRenderComponent(_component_UBadge, {
          color: "success",
          variant: "subtle",
          size: "sm"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UIcon, {
                name: "i-lucide-check",
                class: "w-3 h-3 mr-1"
              }, null, _parent2, _scopeId));
              _push2(` Generating report... `);
            } else {
              return [
                createVNode(_component_UIcon, {
                  name: "i-lucide-check",
                  class: "w-3 h-3 mr-1"
                }),
                createTextVNode(" Generating report... ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></header><div class="flex flex-1 overflow-hidden"><div class="flex-1 flex flex-col min-w-0"><div class="flex-1 overflow-y-auto p-4 space-y-4"><!--[-->`);
      ssrRenderList(unref(messages), (msg, i) => {
        _push(ssrRenderComponent(_component_MessageBubble, {
          key: i,
          role: msg.role,
          content: msg.content
        }, null, _parent));
      });
      _push(`<!--]-->`);
      if (unref(isStreaming) && unref(streamingContent)) {
        _push(ssrRenderComponent(_component_MessageBubble, {
          role: "model",
          content: unref(streamingContent),
          "is-streaming": true
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(isStreaming) && !unref(streamingContent)) {
        _push(`<div class="flex gap-3 justify-start"><div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-bot",
          class: "text-white w-4 h-4"
        }, null, _parent));
        _push(`</div><div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3"><div class="flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="${ssrRenderStyle({ "animation-delay": "0ms" })}"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="${ssrRenderStyle({ "animation-delay": "150ms" })}"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="${ssrRenderStyle({ "animation-delay": "300ms" })}"></span></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(error)) {
        _push(ssrRenderComponent(_component_UAlert, {
          color: "error",
          variant: "soft",
          description: unref(error),
          icon: "i-lucide-alert-circle",
          class: "mx-4 mb-2"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="border-t border-gray-200 dark:border-gray-800 p-4 flex gap-3 shrink-0">`);
      _push(ssrRenderComponent(_component_UTextarea, {
        modelValue: unref(inputMessage),
        "onUpdate:modelValue": ($event) => isRef(inputMessage) ? inputMessage.value = $event : null,
        placeholder: "Type your response...",
        autoresize: "",
        rows: 1,
        class: "flex-1",
        disabled: unref(isStreaming) || unref(isFinalizing),
        onKeydown: handleSend
      }, null, _parent));
      _push(ssrRenderComponent(_component_UButton, {
        icon: "i-lucide-send",
        loading: unref(isStreaming),
        disabled: !unref(inputMessage).trim() || unref(isFinalizing),
        "aria-label": "Send message",
        onClick: handleSend
      }, null, _parent));
      _push(`</div></div><aside class="w-64 border-l border-gray-200 dark:border-gray-800 p-4 hidden lg:block shrink-0 overflow-y-auto">`);
      _push(ssrRenderComponent(_component_ProgressPanel, {
        "current-section": unref(currentSection),
        "completed-sections": unref(completedSections),
        "is-checking-feature": unref(isCheckingFeature)
      }, null, _parent));
      _push(`</aside></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/assessment/[sessionId].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_sessionId_-Cqgrk0nF.mjs.map
