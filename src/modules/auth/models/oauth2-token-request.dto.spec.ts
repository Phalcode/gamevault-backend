import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { OAuth2TokenRequestDto } from "./oauth2-token-request.dto.js";

const valid = {
  code: "Tm90IGEgcmVhbCBjb2RlLCBqdXN0IGFuIGV4YW1wbGU",
  code_verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
};

async function invalidProperties(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(OAuth2TokenRequestDto, body));
  return errors.map((error) => error.property);
}

describe("OAuth2TokenRequestDto", () => {
  it("accepts a code with a PKCE code verifier", async () => {
    expect(await invalidProperties(valid)).toEqual([]);
  });

  it("rejects a missing code", async () => {
    expect(
      await invalidProperties({ code_verifier: valid.code_verifier }),
    ).toEqual(["code"]);
  });

  it("rejects a code verifier outside of RFC 7636", async () => {
    for (const code_verifier of [
      undefined,
      "too-short",
      "a".repeat(129),
      `${valid.code_verifier}+`,
    ]) {
      expect(await invalidProperties({ ...valid, code_verifier })).toEqual([
        "code_verifier",
      ]);
    }
  });
});
