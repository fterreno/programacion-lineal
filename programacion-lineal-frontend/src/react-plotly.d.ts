declare module 'react-plotly.js' {
    import * as React from 'react';

    interface Figure {
        data: object[];
        layout?: object;
        frames?: object[];
    }

    interface PlotParams {
        data: object[];
        layout?: object;
        config?: object;
        style?: React.CSSProperties;
        className?: string;
        useResizeHandler?: boolean;
        onInitialized?: (figure: Figure, graphDiv: HTMLElement) => void;
        onUpdate?: (figure: Figure, graphDiv: HTMLElement) => void;
        onPurge?: (figure: Figure, graphDiv: HTMLElement) => void;
        onError?: (err: Error) => void;
        [key: string]: unknown;
    }

    const Plot: React.ComponentType<PlotParams>;
    export default Plot;
}
