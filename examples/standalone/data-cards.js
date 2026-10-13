const dataCards = [
    {
        title: "Simple usage - just trigger an action",
        action: `<button 
    data-action="test" 
    >Click me!</button>`,
//      targetId: "",
        usageNote: `Simple action defined on javascript code: <br>
    <pre>
    const avi = new AviFlow();
    avi.fn.test = (element) => {
        alert('it works!');
    }
    avi.init();
    </pre>`
    },
    {
        title: "Simple fetch",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/posts" 
    data-target="#target-simple"
    data-param-title="foo"
    data-param-body="bar"
    >Click to Fetch</button>`,
        targetId: "target-simple",
        usageNote: `The way it is used most of the time. <br>
    Mandatory: <strong>data-action=fetch</strong>.<br>
    Usual <strong>data-url</strong> and <strong>data-param-*</strong> is provided.`
    },
    {
        title: "Anchor Trigger as Button",
        action: `<a 
    data-action="fetch" 
    href="https://jsonplaceholder.typicode.com/posts"
    data-target="#target-anchor"
    data-param-title="foo"
    data-param-body="bar"
    >Fetch via Anchor</a>`,
        targetId: "target-anchor",
        usageNote: `Similar with <strong>Simple Example</strong>, but using <strong>a</strong> tag for trigger instead of a button.<br>Using <strong>href</strong> for anchor elements will made obsolete the <strong>data-url</strong> attribute.`
    },
    {
        title: "Minimalist fetch",
        action: `<button 
    data-action="fetch"
    data-target="#target-minimalist"
    data-url='data:application/json;charset=utf-8,{"success":true,"html":"<p>okay!</p>"}'
    >Click to Fetch</button>`,
        targetId: "target-minimalist",
        usageNote: `Minimal mandatory attributes:<ul>
    <li><strong>data-action=fetch</strong> - required for initialization</li>
    <li><strong>data-action=target</strong> - in this case used as working example, it is optional.Success handling function can do the default trarget job.</li>
    <li><strong>data-action=url</strong> - in this case we use a test string to get a result. If missing default value  <strong>#</strong> is used</li>`
    },
    {
        title: "Events handler: Success (function)",
        action: `<button 
    data-action="fetch"
    data-on-success="alert('it works!')"
    data-target="#target-event-success-fn"
    data-url='data:application/json;charset=utf-8,{"success":true,"html":"okay!"}'
    >Click to Fetch</button>`,
        targetId: "target-event-success-fn",
        usageNote: '[...]'
    },
    {
        title: "Events handler: Success (call)",
        action: `<button
    data-action="fetch"
    data-on-success="success"
    data-target="#target-event-success-call"
    data-url='data:application/json;charset=utf-8,{"success":true,"html":"okay!"}'
    >Click to Fetch</button>`,
        targetId: "target-event-success-call",
        usageNote: '[...]'
    },
    {
        title: "Event Handler: Checkbox Change",
        action: `<input 
    data-action="testHandleCheckChange" 
    data-event="change"
    data-target="#target-checkbox-event"
    id="testCheckbox"
    type="checkbox">
    <label for="testCheckbox">Click to toggle</label>`,
        targetId: "target-checkbox-event",
        usageNote: `Demonstrates handling native DOM events, specifically the 'change' event on an input element. The AviFlow mechanism captures the event and invokes the specified handler function with the current state of the input.`
    },
    {
        title: "Event Handler: Select Change",
        action: `<label for="testSelect">Choose one color:</label>
<select
    data-action="testHandleSelectChange" 
    data-event="change"
    data-target="#target-select-event"
    id="testSelect">
        <option>Black</option>
        <option>Blue</option>
        <option>Green</option>
        <option>Red</option>
        <option>White</option>
</select>`,
        targetId: "target-select-event",
        usageNote: `Demonstrates handling native DOM events, specifically the 'change' event on select element. The AviFlow mechanism captures the event and invokes the specified handler function with select value.`
    },
    {
        title: "Fetch using parent data",
        action: `<form id=form-parent"
    data-url="https://jsonplaceholder.typicode.com/posts" 
    data-param-company="aviato-soft">
<button 
    data-action="fetch" 
    data-parent="#form-parent"
    data-target="#target-parent"
    data-param-title="foo"
    >Click me to Fetch</button>
<button 
    data-action="fetch" 
    data-parent="#form-parent"
    data-target="#target-parent"
    data-param-title="bar"
    >Click me to Fetch</button>
</form>`,
        targetId: "target-parent",
        usageNote: ``
    },
/*
    {
        title: "Multiple Params",
        action: `<button 
    data-action="fetch" 
    data-method="GET" 
    data-url="https://jsonplaceholder.typicode.com/users?_id={{userId}}" 
    data-param-userId="1">GET User #1 (Button)</button>`,
        targetId: "case03-target",
        usageNote: "Multiple <strong>data-param-</strong> attributes collected into FormData. Also demonstrates <strong>data-method=GET</strong> with a custom URL template."
    },
    {
        title: "Multiple Targets",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/users/1" 
    data-target="#case04-target-1">Render User Profile</button>`,
        targetId: 'case04-target',
        //      targetIds: ["case04-target-1", "case04-target-2"],
        usageNote: "Each trigger has its own <strong>data-target=\"#...\"</strong> pointing to a different container. One click handles two independent fetches."
    },
    {
        title: "All Parameters Used",
        action: `<button 
    data-action="fetch" 
    data-url="https://jsonplaceholder.typicode.com/users/1" 
    data-method="POST" 
    data-param-ajax="true" 
    data-param-testing-params="This is test param 1" 
    data-param-testingParams="Test param 2" 
    data-param-x="1" 
    data-param-y="2" 
    data-param-z="3" 
    data-state-pending="Fetching..." 
    data-on-success="avi.onSuccess" 
    data-on-error="avi.onError" 
    data-target="#case05-target"
    >POST with Params &amp; Callbacks</button>`,
        targetId: "case05-target",
        usageNote: "Demonstrates every supported attribute: <strong>data-action</strong>, <strong>data-url</strong>, <strong>data-method</strong>, multiple <strong>data-param-</strong>,<br /><strong>data-state-pending</strong>, and custom callbacks <strong>data-on-success</strong> / <strong>data-on-error</strong>."
    }
*/
];