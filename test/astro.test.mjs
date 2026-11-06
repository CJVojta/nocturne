import assert from 'node:assert/strict';
import test from 'node:test';
import {catalog, chartPoint, csvFor, horizontal, sidereal} from '../dist/astro.js';

const near = (a,b,epsilon=1e-6) => assert.ok(Math.abs(a-b)<epsilon,`${a} is not close to ${b}`);

test('Greenwich sidereal angle at J2000',()=>{
  near(sidereal(new Date('2000-01-01T12:00:00Z'),0),280.46061837);
  near(sidereal(new Date('2000-01-01T12:00:00Z'),100),20.46061837);
});

test('celestial equator rises east and sets west at the equator',()=>{
  const east=horizontal(6,0,0,0);
  const west=horizontal(18,0,0,0);
  near(east.alt,0);
  near(east.az,90);
  near(west.alt,0);
  near(west.az,270);
});

test('north celestial pole is at the observer latitude',()=>{
  near(horizontal(0,90,49.396,73).alt,49.396);
  near(horizontal(0,90,49.396,73).az,0);
  near(horizontal(0,90,-33.869,73).alt,-33.869);
});

test('polar chart places zenith at centre and east on the left',()=>{
  assert.deepEqual(chartPoint(90,40,100,100,70),{x:100,y:100});
  const east=chartPoint(0,90,100,100,70);
  near(east.x,30);
  near(east.y,100);
});

test('catalogue has unique targets and CSV quotes commas and quotes',()=>{
  assert.equal(new Set(catalog.map(item=>item.id)).size,16);
  const csv=csvFor([{...catalog[0],name:'A, "B"',alt:30,az:120}],new Date('2026-11-06T21:00:00Z'));
  assert.match(csv,/"A, ""B""","Galaxy","30.0","120.0","2026-11-06T21:00:00.000Z"/);
});
