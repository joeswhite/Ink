QUnit.config.testTimeout = 4000;

Ink.requireModules(['Ink.UI.Toggle_1', 'Ink.Dom.Element_1', 'Ink.Dom.Css_1', 'Ink.Dom.Event_1', 'Ink.Dom.Selector_1', 'Ink.UI.Common_1'], function (Toggle, InkElement, Css, InkEvent, Selector, Common) {
    'use strict';

    function createBag(options) {
        options = options || {};
        var parent = InkElement.create('div', {insertBottom: document.body});
        var trigger = InkElement.create('div', {
            className: options.triggerClassName || 'trigger',
            insertBottom: parent
        });
        var targets = [
            InkElement.create('div', {
                className: (options.targetClassName || 'targets') + ' target-1', insertBottom:parent}),
            InkElement.create('div', {
                className: (options.targetClassName || 'targets') + ' target-2', insertBottom:parent})
        ];
        return { parent: parent, trigger: trigger, targets: targets };
    }

    function bagTest(testName, callBack) {
        var bag = createBag();
        test(testName, Ink.bind(callBack, false, bag.parent, bag.trigger, bag.targets));
        QUnit.testDone(function () {
            if (parent) {
                InkElement.remove(parent);
            }
        });
    }
    
    bagTest('initialState, when defined, controls the state the toggle shows up on', function (_, trigger, targets) {
        equal(
            new Toggle(trigger, { initialState: true, target: targets })
            .getState(), true, '"getState()" = true');
        equal(
            new Toggle(trigger, { initialState: false, target: targets })
            .getState(), false, '"getState()" = false');
    });


    bagTest('the thing adds and removes classes from the target element', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, { target: targets, initialState: true, classNameOn: 'oh-it-is-on', classNameOff: 'oh-it-is-off' });
        ok(Css.hasClassName(targets[0], 'oh-it-is-on'));
        ok(!Css.hasClassName(targets[0], 'oh-it-is-off'));
        toggle.setState(false);
        ok(!Css.hasClassName(targets[0], 'oh-it-is-on'));
        ok(Css.hasClassName(targets[0], 'oh-it-is-off'));
    });

    bagTest('When a className{On,Off} is null, the toggle just toggles that one class.', function (_, trigger, targets) {
        targets[0].className = '';
        var toggle = new Toggle(trigger, { target: targets, initialState: true, classNameOn: 'oh-it-is-on', classNameOff: null });
        equal(targets[0].className, 'oh-it-is-on');
        toggle.setState(false);
        equal(targets[0].className, '');

        toggle = new Toggle(trigger, { target: targets, initialState: true, classNameOn: null, classNameOff: 'oh-it-is-off' });
        equal(targets[0].className, '');
        toggle.setState(false);
        equal(targets[0].className, 'oh-it-is-off');
    });

    bagTest('it also puts and removes an "active" class on the trigger', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, { target: targets, initialState: true });
        ok(Css.hasClassName(trigger, 'active'));
        toggle.setState(false);
        ok(!Css.hasClassName(trigger, 'active'));
    });

    bagTest('when multiple targets are selected, toggle them all!!1', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, { target: targets, initialState: true, classNameOn: 'oh-it-is-on', classNameOff: 'oh-it-is-off' });
        for (var i = 0, len = targets.length; i < len; i++) {
            equal(Css.hasClassName(targets[i], 'oh-it-is-on'), true);
            equal(Css.hasClassName(targets[i], 'oh-it-is-off'), false);
        }
        toggle.setState(false);
        for (i = 0, len = targets.length; i < len; i++) {
            equal(Css.hasClassName(targets[i], 'oh-it-is-on'), false);
            equal(Css.hasClassName(targets[i], 'oh-it-is-off'), true);
        }
    });

    module('Accordions');

    bagTest('When the toggle has isAccordion: true, it looks above the DOM tree for an element which has class "accordion", finds other toggles in that element and closes their targets (by selecting through the data-target attribute\'s value and then setting CSS display: none) when clicked', function () {
        var bag = createBag();
        var bag2 = createBag({ targetClassName: 'targetlol', triggerClassName: 'ink-toggle' });
        bag.parent.className = 'accordion';
        bag.parent.appendChild(bag2.trigger);
        bag.parent.appendChild(bag2.targets[0]);

        bag2.trigger.setAttribute('data-target', '.targetlol');

        var thisToggle = new Toggle(bag.trigger, {
            isAccordion: true,
            target: bag.targets,
            initialState: true
        });
        var otherToggle = new Toggle(bag2.trigger, {
            isAccordion: true,
            target: bag2.targets,
            initialState: false
        });

        InkEvent.fire(bag2.trigger, 'click');
        ok(!thisToggle.getState(), 'Opening the second toggle closed the first toggle');
        ok(otherToggle.getState(), 'The second toggle is indeed open (sanity check)');
        InkEvent.fire(bag2.trigger, 'click');
        ok(!thisToggle.getState(), 'Closing the second toggle closed both toggles');
        ok(!otherToggle.getState(), 'Closing the second toggle closed both toggles');
    });

    module('ancestors');

    bagTest('A toggle can\'t toggle its ancestors', function (_, trigger, targets) {
        targets[0].appendChild(trigger);

        var toggle = new Toggle(trigger, {
            target: targets[0],
            initialState: true,
            classNameOn: 'oh-it-is-on',
            classNameOff: 'oh-it-is-off'
        });

        stop();
        Syn.click(toggle._element, function () {
            ok(Css.hasClassName(targets[0], 'oh-it-is-on'));
            start();
        })
    });

    bagTest('A toggle can\'t toggle its ancestors... unless you set canToggleAnAncestor', function (_, trigger, targets) {
        targets[0].appendChild(trigger);

        var toggle = new Toggle(trigger, {
            target: targets[0],
            initialState: true,
            canToggleAnAncestor: true,
            classNameOn: 'oh-it-is-on',
            classNameOff: 'oh-it-is-off'
        });

        stop();
        Syn.click(toggle._element, function () {
            ok(Css.hasClassName(targets[0], 'oh-it-is-off'));
            start();
        })
    });

    module('show-all/hide-all (default usage)');

    bagTest('computing initialState from visibility', function (_, trigger, targets) {
        var toggle;
        toggle = new Toggle(trigger, { target: targets });
        equal(toggle.getState(), true);

        targets[0].style.display = 'none';
        toggle = new Toggle(trigger, { target: targets });
        equal(toggle.getState(), false);
    });

    bagTest('triggerEvent chooses the event that toggles the thing.', function (_, trigger, target) {
        var toggle = new Toggle(trigger, {
            target: target,
            initialState: true,
            triggerEvent: 'my:event'
        });
        equal(toggle.getState(), true);
        InkEvent.fire(trigger, 'my:event');
        equal(toggle.getState(), false);
        InkEvent.fire(trigger, 'click');
        equal(toggle.getState(), false);
    });

    module('onChangeState callback');
    bagTest('is called when state changes', function (_, trigger, targets) {
        var i = 0;
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            triggerEvent: 'my:event',
            onChangeState: function () { i++; }
        });
        equal(i, 1);  // callback incremented i
        toggle.setState(true, true);
        equal(i, 1);  // callback not called because state didn't change
        toggle.setState(false, true);
        equal(i, 2);  // callback called
    });

    bagTest('returning false cancels toggling', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            triggerEvent: 'my:event',
            onChangeState: function () { return false; }
        });
        equal(toggle.getState(), false);
        toggle.setState(true, true);
        equal(toggle.getState(), false);
    });

    module('closeOnClick (closeOnOutsideClick)');
    bagTest('does close the thing', function (bag, trigger, targets) {
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            closeOnClick: true
        });
        ok(toggle.getState());
        var somethingElse = InkElement.create('div', { insertBottom: bag });
        InkEvent.fire(somethingElse, 'click');
        ok(!toggle.getState());
    });

    bagTest('doesn\'t close other things', function (bag, trigger, targets) {
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            closeOnClick: true
        });

        ok(toggle.getState(), 'sanity check -- before fire, toggle1 is open');
        var bag2 = createBag({ triggerClassName: 'trigger-2', targetClassName: 'targets-2' });
        var toggle2 = new Toggle(bag2.trigger, {
            target: bag2.targets,
            initialState: true,
            closeOnClick: true
        });
        InkEvent.fire(bag2.trigger, 'click');
        ok(!toggle2.getState(), 'sanity check -- toggle2 should be closed now');
        ok(toggle.getState(), '... but toggle1 should be still open.');
    });
    bagTest('can be canceled by the onchangestate callback', function (bag, trigger, targets) {
        var doCancel = false;
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            closeOnClick: true,
            onChangeState: function () { return doCancel ? false : null; }
        });
        doCancel = true;
        ok(toggle.getState());
        InkEvent.fire(bag, 'click');
        ok(toggle.getState());
    });
    module('Container/Containee logic.');
    bagTest('closeOnInsideClick', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            closeOnInsideClick: true
        });
        ok(toggle.getState());
        InkEvent.fire(targets[1], 'click');
        ok(!toggle.getState());
    });

    bagTest('closeOnInsideClick with a selector', function (_, trigger, targets) {
        var toggle = new Toggle(trigger, {
            target: targets,
            initialState: true,
            closeOnInsideClick: '.targets.target-1'
        });
        ok(toggle.getState());
        InkEvent.fire(targets[1], 'click');  // click on target-2
        ok(toggle.getState());
        InkEvent.fire(targets[0], 'click');  // click on target-1
        ok(!toggle.getState());
    });

    bagTest('triggering the event on the togglee when the togglee is a child of the toggler.', function (bag) {
        var trigger = InkElement.create('div', { insertBottom: bag });
        var target = InkElement.create('div', { insertBottom: trigger});
        var toggle = new Toggle(trigger, {
            target: target,
            initialState: true,
            closeOnInsideClick: null
        });
        ok(toggle.getState());
        InkEvent.fire(target, 'click');
        ok(toggle.getState(), 'didnt close even though the event bubbled upwards from the target');
    });

    bagTest('(regression): creating a toggle with initialState:false doesn\'t add classNameOff to it', function (bag, trigger, targets) {
        equal(
            new Toggle(trigger, { initialState: false, target: targets, classNameOff: 'offs' })
            .getState(), false, '"getState()" = false');
        ok(Css.hasClassName(targets[0], 'offs'))
    });
});

