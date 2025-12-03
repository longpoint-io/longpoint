export const TreeItemType = {
  DIRECTORY: 'DIRECTORY',
  MEDIA: 'MEDIA',
} as const;

export type TreeItemType = (typeof TreeItemType)[keyof typeof TreeItemType];

export interface TreeItem {
  treeItemType: TreeItemType;
}
