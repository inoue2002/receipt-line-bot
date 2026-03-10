#!/bin/bash
set -e

echo "=== GAS プロジェクト削除 ==="
echo ""
echo "GAS エディタを開きます。"
echo "以下の手順でプロジェクトを削除してください："
echo ""
echo "  1. 左メニュー → 概要"
echo "  2. 右上の「︙」→ ゴミ箱に移動"
echo ""
npx clasp open
echo ""
echo "削除後、ローカルの .clasp.json も削除してください："
echo "  rm .clasp.json"
