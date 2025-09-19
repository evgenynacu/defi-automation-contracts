import {findToken} from "./tokens";
import {describe} from "mocha";
import {expect} from "chai";

describe('tokens', () => {
	it('should find tokens', async () => {
		const name = findToken("0xb6ac3d5da138918ac4e84441e924a20daa60dbdd")
		expect(name).to.not.be.undefined
	})
})