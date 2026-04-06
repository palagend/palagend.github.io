#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== 开始部署流程 ==="

SOURCE_DIR="dist"
if [ "$1" = "vercel" ]; then
    SOURCE_DIR="dist-vercel"
fi

if [ ! -d "$SOURCE_DIR" ]; then
    echo "错误: $SOURCE_DIR 目录不存在"
    exit 1
fi

echo "=== 使用 rsync 同步 $SOURCE_DIR 内容到根目录 ==="
rsync -av --delete --exclude="deploy.sh" --exclude=".git" --exclude=".github" --exclude="dist" --exclude="dist-vercel" --exclude=".gitignore" "$SOURCE_DIR"/ .
echo "✓ 内容同步完成"

echo "=== 检查 git 状态 ==="
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "错误: 当前目录不是 git 仓库"
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "=== 添加文件到暂存区 ==="
    git add -A
    
    echo "=== 修改最后一次提交 ==="
    git commit --amend -m "update pages"
    
    echo "=== 强制推送到远程仓库 ==="
    git push -f
    
    echo "=== 部署完成 ==="
else
    echo "警告: 没有需要提交的更改"
    exit 0
fi
