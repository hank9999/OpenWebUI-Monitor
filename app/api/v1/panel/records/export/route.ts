import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { PoolClient } from "pg";

export async function GET() {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    const records = await client.query(`
      SELECT 
        nickname,
        use_time,
        model_name,
        input_tokens,
        output_tokens,
        cost,
        balance_after
      FROM user_usage_records
      ORDER BY use_time DESC
    `);

    // 生成 CSV 内容
    const csvHeaders = [
      "User",
      "Time",
      "Model",
      "Input tokens",
      "Output tokens",
      "Cost",
      "Balance",
    ];
    const rows = records.rows.map((record) => [
      record.nickname,
      new Date(record.use_time).toLocaleString(),
      record.model_name,
      record.input_tokens,
      record.output_tokens,
      Number(record.cost).toFixed(4),
      Number(record.balance_after).toFixed(4),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // 设置响应头
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/csv; charset=utf-8");
    responseHeaders.set(
      "Content-Disposition",
      "attachment; filename=usage_records.csv"
    );

    return new Response(csvContent, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Fail to export records:", error);
    return NextResponse.json(
      { error: "Fail to export records" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
