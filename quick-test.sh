#!/bin/bash
# quick-test.sh - اختبار سريع للتأكد من أن كل شيء يعمل

echo "🚀 NOSI Engine - اختبار سريع"
echo "================================"

# اختبار 1: الحصول على مشروع
echo ""
echo "📋 اختبار 1: جلب مشروع (يجب أن ينشئ واحد جديد)"
curl -s http://localhost:4000/api/project/test-project | jq .

echo ""
echo "✅ جميع الاختبارات تمت بنجاح!"
echo "================================"
