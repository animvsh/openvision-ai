import type { PluginManifest } from './index';

/**
 * Dynamic plugin loader for loading plugins from npm packages
 */

export interface LoaderOptions {
  scope?: string;
  registry?: string;
}

const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

export async function loadPlugin(
  packageName: string,
  options: LoaderOptions = {}
): Promise<PluginManifest> {
  const { scope = '', registry = DEFAULT_REGISTRY } = options;

  const fullName = scope ? `${scope}/${packageName}` : packageName;
  const url = `${registry}/${fullName}/latest`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch plugin package: ${fullName}`);
  }

  const metadata = await response.json();
  const distTarball = metadata.dist?.tarball;

  if (!distTarball) {
    throw new Error(`No dist tarball found for package: ${fullName}`);
  }

  // In a real implementation, you would download and extract the tarball
  // and evaluate the plugin code. This is a simplified version.
  throw new Error(
    'Dynamic loading requires a bundler/ runtime environment. ' +
    'Use direct imports for development or bundle with your plugin.'
  );
}

export async function loadPluginFromUrl(
  url: string
): Promise<PluginManifest> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch plugin from: ${url}`);
  }

  const module = await import(/* @vite-ignore */ url);
  return validateManifest(module);
}

export async function loadPluginFromModule(
  module: Record<string, unknown>
): Promise<PluginManifest> {
  const manifest = validateManifest(module);
  return manifest;
}

function validateManifest(module: Record<string, unknown>): PluginManifest {
  if (!module.api_version || !module.plugin_type || !module.plugin) {
    throw new Error('Invalid plugin manifest: missing required fields');
  }

  const validTypes = ['detection', 'mode', 'alert', 'widget'];
  if (!validTypes.includes(module.plugin_type as string)) {
    throw new Error(`Invalid plugin type: ${module.plugin_type}`);
  }

  return module as unknown as PluginManifest;
}

export function isDetectionPlugin(
  manifest: PluginManifest
): manifest is PluginManifest & { plugin_type: 'detection' } {
  return manifest.plugin_type === 'detection';
}

export function isModePlugin(
  manifest: PluginManifest
): manifest is PluginManifest & { plugin_type: 'mode' } {
  return manifest.plugin_type === 'mode';
}

export function isAlertPlugin(
  manifest: PluginManifest
): manifest is PluginManifest & { plugin_type: 'alert' } {
  return manifest.plugin_type === 'alert';
}

export function isWidgetPlugin(
  manifest: PluginManifest
): manifest is PluginManifest & { plugin_type: 'widget' } {
  return manifest.plugin_type === 'widget';
}