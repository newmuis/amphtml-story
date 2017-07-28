/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  mapRange,
  logRange,
  sum,
} from '../../../src/utils/math';

describes.sandboxed('mapRange', {}, () => {

  it('should map a number to the corrent value', () => {
    expect(mapRange(5, 0, 10, 40, 80)).to.equal(60);
    expect(mapRange(5, 0, 10, 10, 20)).to.equal(15);
  });

  it('should automatically detect source range bounds order', () => {
    expect(mapRange(5, 10, 0, 40, 80)).to.equal(60);
    expect(mapRange(8, 10, 0, 10, 20)).to.equal(12);
  });

  it('should accept decreasing target ranges', () => {
    expect(mapRange(8, 0, 10, 10, 0)).to.equal(2);
  });

  it('should constrain input to the source range', () => {
    expect(mapRange(-2, 0, 10, 10, 20)).to.equal(10);
    expect(mapRange(50, 0, 10, 10, 20)).to.equal(20);
    expect(mapRange(19, 0, 5, 40, 80)).to.equal(80);
  });

});

describes.sandboxed('logRange', {}, () => {

  it('should map a number to the corrent value', () => {
    const scale1 = Math.log(100) / 10;
    expect(logRange(2, 10, 100)).to.equal(Math.exp(scale1 * 2));
    expect(logRange(3, 10, 100)).to.equal(Math.exp(scale1 * 3));
    const scale2 = Math.log(30) / 20;
    expect(logRange(6, 20, 30)).to.equal(Math.exp(scale2 * 6));
    expect(logRange(10, 20, 30)).to.equal(Math.exp(scale2 * 10));
  });

});

describes.sandboxed('sum', {}, () => {

  it('should sum up an array of numbers', () => {
    expect(sum([2, 10, 100])).to.equal(112);
    expect(sum([-3, 2, 44])).to.equal(43);
  });

});
