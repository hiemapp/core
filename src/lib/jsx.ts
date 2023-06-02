import type { componentFactory } from '~/dashboard/DashboardWidget/utils/helpers'

export function render(wrapper: ReturnType<typeof componentFactory>, props: any) {
    wrapper(props);
}