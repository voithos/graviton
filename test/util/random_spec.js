import random from '../../src/util/random';

describe('random', () => {
    beforeEach(() => {
        spyOn(Math, 'random').and.returnValue(0.1);
    });

    describe('number()', () => {
        it('should return a number generated between two points', () => {
            expect(random.number(3, 5)).toBe(3.2);
        });

        it('should use 0 as the base if one point is omitted', () => {
            expect(random.number(7)).toBeCloseTo(0.7);
        });
    });

    describe('integer()', () => {
        it('should return an integer generated between two points', () => {
            expect(random.integer(3, 5)).toBe(3);
            Math.random.and.returnValue(0.8);
            expect(random.integer(3, 5)).toBe(4);
        });

        it('should use 0 as the base if one point is omitted', () => {
            expect(random.integer(10)).toBe(1);
            Math.random.and.returnValue(0.8);
            expect(random.integer(10)).toBe(8);
        });
    });

    describe('directional()', () => {
        let randVal, nextVal;

        beforeEach(() => {
            randVal = 0.6;
            nextVal = 0.4
            Math.random.and.callFake(() => {
                let oldVal = randVal;
                randVal = nextVal;
                return oldVal;
            });
        });

        it('should return a random directional', () => {
            expect(random.directional(4, 8)).toBe(6.4);
        });

        it('should randomly switch sign', () => {
            nextVal = 0.6;
            expect(random.directional(4, 8)).toBe(-6.4);
        });

        it('should use 0 as the base if one point is omitted', () => {
            expect(random.directional(3)).toBeCloseTo(1.8);
        });
    });

    describe('color()', () => {
        it('should return a random color', () => {
            Math.random.and.returnValue(0.5);
            expect(random.color()).toBe('#800000');
        });

        it('should not exceed the color limits', () => {
            Math.random.and.returnValue(0);
            expect(random.color()).toBe('#000000');
            Math.random.and.returnValue(1.0 - Number.EPSILON);
            expect(random.color()).toBe('#ffffff');
        });
    });
});
