import json

with open("bottom.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    item["category"] = "BOTTOM"

with open("bottom.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("done")