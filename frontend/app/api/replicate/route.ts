import { NextResponse } from "next/server";
import makeGarmentDes from "@/utils/garment_description_generator";
import { ClothingItem } from "@/types/models";

const REPLICATE_API_BASE = "https://api.replicate.com/v1/predictions";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_IDM_VTON_VERSION;

  if (!token || !version) {
    return NextResponse.json(
      { error: "Missing Replicate configuration" },
      { status: 500 },
    );
  }

  const { modelImageUrl, item } = (await request.json()) as {
    modelImageUrl?: string;
    item?: ClothingItem;
  };

  if (!item?.imageUrl || !modelImageUrl) {
    return NextResponse.json(
      { error: "Missing model or garment image" },
      { status: 400 },
    );
  }

  const createResponse = await fetch(REPLICATE_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: version,
      input: {
        crop: false,
        seed: 42,
        steps: 15,
        category: item.category === "BOTTOM" ? "lower_body" : "upper_body",
        force_dc: false,
        garm_img: item.imageUrl,
        human_img: modelImageUrl,
        mask_only: false,
        garment_des: makeGarmentDes(item),
      },
    }),
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.text();
    return NextResponse.json(
      { error: "Failed to create prediction", detail: errorBody },
      { status: createResponse.status },
    );
  }

  let prediction = (await createResponse.json()) as {
    status: string;
    output?: string[] | string;
    urls?: { get?: string };
  };

  const pollUrl = prediction.urls?.get;
  if (!pollUrl) {
    return NextResponse.json(
      { error: "Missing prediction status URL" },
      { status: 500 },
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (prediction.status === "succeeded") {
      const output = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;
      return NextResponse.json({ output });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
    }
    await sleep(1500);
    const pollResponse = await fetch(pollUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    prediction = (await pollResponse.json()) as typeof prediction;
  }

  return NextResponse.json({ error: "Prediction timed out" }, { status: 504 });
}
