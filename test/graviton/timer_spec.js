import env from '../../src/util/env';
import gtTimer from '../../src/graviton/timer';

describe('timer', () => {
    let window;
    beforeEach(() => {
        window = jasmine.createSpyObj('window', [
            'requestAnimationFrame',
            'cancelAnimationFrame',
            'setInterval',
            'clearInterval'
        ]);
        window.performance = jasmine.createSpyObj('performance', ['now']);
        spyOn(env, 'getWindow').and.returnValue(window);
    });

    describe('animation', () => {
        let spy, timer;
        beforeEach(() => {
            spy = jasmine.createSpy('callback');
            timer = new gtTimer(spy);
        });

        it('should not begin animation immediately', () => {
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
            expect(spy).not.toHaveBeenCalled();
        });

        it('should begin animating when start is called', () => {
            timer.start();
            expect(window.requestAnimationFrame).toHaveBeenCalled();
            expect(window.setInterval).not.toHaveBeenCalled();
        });

        it('should call the target with the elapsed time', () => {
            let called = false;
            window.requestAnimationFrame.and.callFake(fn => {
                if (!called) {
                    called = true;
                    fn(500);
                }
            });
            window.performance.now.and.returnValue(100);
            timer.start();

            expect(window.performance.now).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(400);
        });

        it('should clear the animation when stopped', () => {
            window.requestAnimationFrame.and.returnValue(5);
            timer.start();
            timer.stop();
            expect(window.cancelAnimationFrame).toHaveBeenCalledWith(5);
        });

        it('should toggle between start and stopped', () => {
            timer.toggle();
            expect(window.requestAnimationFrame).toHaveBeenCalled();
            expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
            window.requestAnimationFrame.calls.reset();
            window.cancelAnimationFrame.calls.reset();
            timer.toggle();
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
            expect(window.cancelAnimationFrame).toHaveBeenCalled();
        });
    });

    describe('interval', () => {
        let spy, timer;
        beforeEach(() => {
            spy = jasmine.createSpy('callback');
            timer = new gtTimer(spy, 60);
        });

        it('should not begin the interval immediately', () => {
            expect(window.setInterval).not.toHaveBeenCalled();
        });

        it('should call setInterval with the appropriate timeout', () => {
            timer.start();
            // Expect 60 fps, meaning a timeout of 16ms
            expect(window.setInterval).toHaveBeenCalledWith(jasmine.any(Function), 16);
        });

        it('should clear the interval when stopped', () => {
            window.setInterval.and.returnValue(5);
            timer.start();
            timer.stop();
            expect(window.clearInterval).toHaveBeenCalledWith(5);
        });

        it('should toggle between start and stopped', () => {
            timer.toggle();
            expect(window.setInterval).toHaveBeenCalled();
            expect(window.clearInterval).not.toHaveBeenCalled();
            window.setInterval.calls.reset();
            window.clearInterval.calls.reset();
            timer.toggle();
            expect(window.setInterval).not.toHaveBeenCalled();
            expect(window.clearInterval).toHaveBeenCalled();
        });
    });
});
