import { a as _sfc_main$5, _ as _sfc_main$1 } from './Button-DBQu6OuW.mjs';
import { _ as _sfc_main$2 } from './Card-Dh-7i_s7.mjs';
import { _ as _sfc_main$3 } from './Badge-zNc4Ede2.mjs';
import { defineComponent, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, openBlock, createBlock, Fragment, renderList, createCommentVNode, computed, toValue, reactive, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList } from 'vue/server-renderer';
import { e as useRoute, b as useSeoMeta, f as fetchDefaults, d as useNuxtApp } from './server.mjs';
import { G as hash } from '../nitro/nitro.mjs';
import { isPlainObject } from '@vue/shared';
import { u as useAsyncData } from './index-CnueD9va.mjs';
import 'reka-ui';
import '@vueuse/core';
import 'tailwind-variants';
import './nuxt-link-C6CuK7rg.mjs';
import 'vue-router';
import 'tailwindcss/colors';
import '@iconify/vue';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';
import '@iconify/utils/lib/css/icon';
import 'perfect-debounce';

function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useRequestFetch() {
  return useRequestEvent()?.$fetch || globalThis.$fetch;
}
function useFetch(request, arg1, arg2) {
  const [opts = {}, autoKey] = [{}, arg1];
  const _request = computed(() => toValue(request));
  const key = computed(() => toValue(opts.key) || "$f" + hash([autoKey, typeof _request.value === "string" ? _request.value : "", ...generateOptionSegments(opts)]));
  if (!opts.baseURL && typeof _request.value === "string" && (_request.value[0] === "/" && _request.value[1] === "/")) {
    throw new Error('[nuxt] [useFetch] the request URL must not start with "//".');
  }
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch: watchSources,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    ...fetchOptions
  } = opts;
  const _fetchOptions = reactive({
    ...fetchDefaults,
    ...fetchOptions,
    cache: typeof opts.cache === "boolean" ? void 0 : opts.cache
  });
  const _asyncDataOptions = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    watch: watchSources === false ? [] : [...watchSources || [], _fetchOptions]
  };
  const asyncData = useAsyncData(watchSources === false ? key.value : key, (_, { signal }) => {
    let _$fetch = opts.$fetch || globalThis.$fetch;
    if (!opts.$fetch) {
      const isLocalFetch = typeof _request.value === "string" && _request.value[0] === "/" && (!toValue(opts.baseURL) || toValue(opts.baseURL)[0] === "/");
      if (isLocalFetch) {
        _$fetch = useRequestFetch();
      }
    }
    return _$fetch(_request.value, { signal, ..._fetchOptions });
  }, _asyncDataOptions);
  return asyncData;
}
function generateOptionSegments(opts) {
  const segments = [
    toValue(opts.method)?.toUpperCase() || "GET",
    toValue(opts.baseURL)
  ];
  for (const _obj of [opts.query || opts.params]) {
    const obj = toValue(_obj);
    if (!obj) {
      continue;
    }
    const unwrapped = {};
    for (const [key, value] of Object.entries(obj)) {
      unwrapped[toValue(key)] = toValue(value);
    }
    segments.push(unwrapped);
  }
  if (opts.body) {
    const value = toValue(opts.body);
    if (!value) {
      segments.push(hash(value));
    } else if (value instanceof ArrayBuffer) {
      segments.push(hash(Object.fromEntries([...new Uint8Array(value).entries()].map(([k, v]) => [k, v.toString()]))));
    } else if (value instanceof FormData) {
      const obj = {};
      for (const entry of value.entries()) {
        const [key, val] = entry;
        obj[key] = val instanceof File ? val.name : val;
      }
      segments.push(hash(obj));
    } else if (isPlainObject(value)) {
      segments.push(hash(reactive(value)));
    } else {
      try {
        segments.push(hash(value));
      } catch {
        console.warn("[useFetch] Failed to hash body", value);
      }
    }
  }
  return segments;
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[sessionId]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const sessionId = route.params.sessionId;
    const { data, pending, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/assessment/${sessionId}`,
      "$bxFGd0whLf"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    useSeoMeta({ title: "Your Assessment Report — Payroll Fit" });
    const statusConfig = {
      supported: { color: "success", icon: "i-lucide-check-circle-2", label: "Supported" },
      partial: { color: "warning", icon: "i-lucide-alert-circle", label: "Partial Support" },
      gap: { color: "error", icon: "i-lucide-x-circle", label: "Gap" }
    };
    function getFitLabel(score) {
      if (score >= 80) return { label: "Strong Fit", color: "success" };
      if (score >= 60) return { label: "Good Fit", color: "primary" };
      if (score >= 40) return { label: "Partial Fit", color: "warning" };
      return { label: "Poor Fit", color: "error" };
    }
    function downloadReport() {
      (void 0).print();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UIcon = _sfc_main$5;
      const _component_UButton = _sfc_main$1;
      const _component_UCard = _sfc_main$2;
      const _component_UBadge = _sfc_main$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-3xl mx-auto px-4 py-8 space-y-6" }, _attrs))}>`);
      if (unref(pending)) {
        _push(`<div class="flex justify-center py-20">`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-loader-2",
          class: "w-8 h-8 animate-spin text-gray-400"
        }, null, _parent));
        _push(`</div>`);
      } else if (unref(error) || !unref(data)?.assessment) {
        _push(`<div class="text-center py-20 space-y-3">`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-file-x",
          class: "w-12 h-12 text-gray-300 mx-auto"
        }, null, _parent));
        _push(`<p class="text-gray-500">Report not found. The assessment may still be processing.</p>`);
        _push(ssrRenderComponent(_component_UButton, {
          variant: "ghost",
          icon: "i-lucide-arrow-left",
          to: `/assessment/${unref(sessionId)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Return to assessment `);
            } else {
              return [
                createTextVNode(" Return to assessment ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="text-center space-y-1"><h1 class="text-3xl font-bold">Payroll Fit Report</h1>`);
        if (unref(data).session) {
          _push(`<p class="text-gray-500">${ssrInterpolate(unref(data).session.companyName)} · ${ssrInterpolate(unref(data).session.industry)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_component_UCard, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="flex items-center justify-between gap-4"${_scopeId}><div${_scopeId}><p class="text-sm text-gray-500 mb-1"${_scopeId}>Overall Fit Score</p><p class="text-5xl font-bold tracking-tight"${_scopeId}>${ssrInterpolate(unref(data).assessment.overallFitScore)} <span class="text-2xl font-normal text-gray-400"${_scopeId}>/100</span></p>`);
              _push2(ssrRenderComponent(_component_UBadge, {
                color: getFitLabel(unref(data).assessment.overallFitScore).color,
                class: "mt-3",
                size: "md"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`${ssrInterpolate(getFitLabel(unref(data).assessment.overallFitScore).label)}`);
                  } else {
                    return [
                      createTextVNode(toDisplayString(getFitLabel(unref(data).assessment.overallFitScore).label), 1)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div><svg viewBox="0 0 36 36" class="w-28 h-28 -rotate-90 shrink-0"${_scopeId}><circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gray-200 dark:text-gray-700"${_scopeId}></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"${ssrRenderAttr("stroke-dasharray", `${unref(data).assessment.overallFitScore} 100`)} class="${ssrRenderClass({
                "text-green-500": unref(data).assessment.overallFitScore >= 80,
                "text-blue-500": unref(data).assessment.overallFitScore >= 60 && unref(data).assessment.overallFitScore < 80,
                "text-yellow-500": unref(data).assessment.overallFitScore >= 40 && unref(data).assessment.overallFitScore < 60,
                "text-red-500": unref(data).assessment.overallFitScore < 40
              })}"${_scopeId}></circle></svg></div>`);
            } else {
              return [
                createVNode("div", { class: "flex items-center justify-between gap-4" }, [
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm text-gray-500 mb-1" }, "Overall Fit Score"),
                    createVNode("p", { class: "text-5xl font-bold tracking-tight" }, [
                      createTextVNode(toDisplayString(unref(data).assessment.overallFitScore) + " ", 1),
                      createVNode("span", { class: "text-2xl font-normal text-gray-400" }, "/100")
                    ]),
                    createVNode(_component_UBadge, {
                      color: getFitLabel(unref(data).assessment.overallFitScore).color,
                      class: "mt-3",
                      size: "md"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(getFitLabel(unref(data).assessment.overallFitScore).label), 1)
                      ]),
                      _: 1
                    }, 8, ["color"])
                  ]),
                  (openBlock(), createBlock("svg", {
                    viewBox: "0 0 36 36",
                    class: "w-28 h-28 -rotate-90 shrink-0"
                  }, [
                    createVNode("circle", {
                      cx: "18",
                      cy: "18",
                      r: "15.9",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2.5",
                      class: "text-gray-200 dark:text-gray-700"
                    }),
                    createVNode("circle", {
                      cx: "18",
                      cy: "18",
                      r: "15.9",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2.5",
                      "stroke-linecap": "round",
                      "stroke-dasharray": `${unref(data).assessment.overallFitScore} 100`,
                      class: {
                        "text-green-500": unref(data).assessment.overallFitScore >= 80,
                        "text-blue-500": unref(data).assessment.overallFitScore >= 60 && unref(data).assessment.overallFitScore < 80,
                        "text-yellow-500": unref(data).assessment.overallFitScore >= 40 && unref(data).assessment.overallFitScore < 60,
                        "text-red-500": unref(data).assessment.overallFitScore < 40
                      }
                    }, null, 10, ["stroke-dasharray"])
                  ]))
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UCard, null, {
          header: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="font-semibold text-base"${_scopeId}>Executive Summary</h2>`);
            } else {
              return [
                createVNode("h2", { class: "font-semibold text-base" }, "Executive Summary")
              ];
            }
          }),
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap"${_scopeId}>${ssrInterpolate(unref(data).assessment.summary)}</p>`);
            } else {
              return [
                createVNode("p", { class: "text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap" }, toDisplayString(unref(data).assessment.summary), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UCard, null, {
          header: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="font-semibold text-base"${_scopeId}>Section Breakdown</h2>`);
            } else {
              return [
                createVNode("h2", { class: "font-semibold text-base" }, "Section Breakdown")
              ];
            }
          }),
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="space-y-4"${_scopeId}><!--[-->`);
              ssrRenderList(unref(data).assessment.sections, (section) => {
                _push2(`<div class="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-2"${_scopeId}><div class="flex items-start justify-between gap-3"${_scopeId}><h3 class="font-medium text-sm"${_scopeId}>${ssrInterpolate(section.name)}</h3>`);
                _push2(ssrRenderComponent(_component_UBadge, {
                  color: statusConfig[section.status].color,
                  size: "sm",
                  class: "shrink-0"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_UIcon, {
                        name: statusConfig[section.status].icon,
                        class: "w-3 h-3 mr-1"
                      }, null, _parent3, _scopeId2));
                      _push3(` ${ssrInterpolate(statusConfig[section.status].label)}`);
                    } else {
                      return [
                        createVNode(_component_UIcon, {
                          name: statusConfig[section.status].icon,
                          class: "w-3 h-3 mr-1"
                        }, null, 8, ["name"]),
                        createTextVNode(" " + toDisplayString(statusConfig[section.status].label), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
                _push2(`</div><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(section.findings)}</p>`);
                if (section.customerRequirements?.length) {
                  _push2(`<ul class="space-y-1 mt-2"${_scopeId}><!--[-->`);
                  ssrRenderList(section.customerRequirements, (req) => {
                    _push2(`<li class="text-xs text-gray-500 flex items-start gap-1.5"${_scopeId}>`);
                    _push2(ssrRenderComponent(_component_UIcon, {
                      name: "i-lucide-chevron-right",
                      class: "w-3 h-3 mt-0.5 shrink-0"
                    }, null, _parent2, _scopeId));
                    _push2(` ${ssrInterpolate(req)}</li>`);
                  });
                  _push2(`<!--]--></ul>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              return [
                createVNode("div", { class: "space-y-4" }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(unref(data).assessment.sections, (section) => {
                    return openBlock(), createBlock("div", {
                      key: section.name,
                      class: "border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-2"
                    }, [
                      createVNode("div", { class: "flex items-start justify-between gap-3" }, [
                        createVNode("h3", { class: "font-medium text-sm" }, toDisplayString(section.name), 1),
                        createVNode(_component_UBadge, {
                          color: statusConfig[section.status].color,
                          size: "sm",
                          class: "shrink-0"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_UIcon, {
                              name: statusConfig[section.status].icon,
                              class: "w-3 h-3 mr-1"
                            }, null, 8, ["name"]),
                            createTextVNode(" " + toDisplayString(statusConfig[section.status].label), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])
                      ]),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(section.findings), 1),
                      section.customerRequirements?.length ? (openBlock(), createBlock("ul", {
                        key: 0,
                        class: "space-y-1 mt-2"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(section.customerRequirements, (req) => {
                          return openBlock(), createBlock("li", {
                            key: req,
                            class: "text-xs text-gray-500 flex items-start gap-1.5"
                          }, [
                            createVNode(_component_UIcon, {
                              name: "i-lucide-chevron-right",
                              class: "w-3 h-3 mt-0.5 shrink-0"
                            }),
                            createTextVNode(" " + toDisplayString(req), 1)
                          ]);
                        }), 128))
                      ])) : createCommentVNode("", true)
                    ]);
                  }), 128))
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UCard, null, {
          header: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="font-semibold text-base"${_scopeId}>Implementation Notes</h2>`);
            } else {
              return [
                createVNode("h2", { class: "font-semibold text-base" }, "Implementation Notes")
              ];
            }
          }),
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap"${_scopeId}>${ssrInterpolate(unref(data).assessment.recommendations)}</p>`);
            } else {
              return [
                createVNode("p", { class: "text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap" }, toDisplayString(unref(data).assessment.recommendations), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="flex gap-3 justify-center print:hidden pb-4">`);
        _push(ssrRenderComponent(_component_UButton, {
          icon: "i-lucide-printer",
          variant: "outline",
          color: "neutral",
          onClick: downloadReport
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Download PDF `);
            } else {
              return [
                createTextVNode(" Download PDF ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UButton, { icon: "i-lucide-calendar" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Book a Demo `);
            } else {
              return [
                createTextVNode(" Book a Demo ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/report/[sessionId].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_sessionId_-BsMUlW69.mjs.map
