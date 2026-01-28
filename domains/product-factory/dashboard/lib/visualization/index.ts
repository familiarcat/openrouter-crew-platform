/**
 * Visualization Library
 * Core graph visualization for project architecture
 */

// Core domain model
export { Graph } from './core/Graph';
export type { GraphOptions } from './core/Graph';
export { Node } from './core/Node';
export type { NodeType, NodeMetadata } from './core/Node';
export { Edge } from './core/Edge';
export type { EdgeType, EdgeMetadata } from './core/Edge';

// Services
export { ProjectGraphBuilder } from './services/ProjectGraphBuilder';
export type { Project, Domain, ViewDimension } from './services/ProjectGraphBuilder';

// Adapters
export { CytoscapeAdapter } from './adapters/CytoscapeAdapter';
export type { LayoutType, CytoscapeConfig } from './adapters/CytoscapeAdapter';
