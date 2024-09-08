import dts from 'rollup-plugin-dts';

export default [
    {
        input: './dist/extensions/api/index.d.ts',
        output: {
            file: './dist/bundles/extensions-api.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
    {
        input: './dist/scripts/api/home.d.ts',
        output: {
            file: './dist/bundles/home-api.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    }
];