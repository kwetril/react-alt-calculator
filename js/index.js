'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var alt = new Alt();

var CalculatorActions = (function () {
  function CalculatorActions() {
    _classCallCheck(this, CalculatorActions);
  }

  CalculatorActions.prototype.resetState = function resetState() {
    this.dispatch();
  };

  CalculatorActions.prototype.eraseDigit = function eraseDigit() {
    this.dispatch();
  };

  CalculatorActions.prototype.inputNumberElement = function inputNumberElement(element) {
    this.dispatch(element);
  };

  CalculatorActions.prototype.setOperation = function setOperation(operation) {
    this.dispatch(operation);
  };

  CalculatorActions.prototype.calculateResult = function calculateResult() {
    this.dispatch();
  };

  return CalculatorActions;
})();

var actions = alt.createActions(CalculatorActions);

var CalculatorStore = (function () {
  function CalculatorStore() {
    _classCallCheck(this, CalculatorStore);

    this.value = '';
    this.firstArgument = null;
    this.operation = null;
    this.errState = 0;
    this.maxDigits = 10;
    this.bindListeners({
      handleResetState: actions.RESET_STATE,
      handleEraseDigit: actions.ERASE_DIGIT,
      handleInputNumberElement: actions.INPUT_NUMBER_ELEMENT,
      handleSetOperation: actions.SET_OPERATION,
      handleCalculateResult: actions.CALCULATE_RESULT
    });
    this.exportPublicMethods({
      getValue: this.getValue
    });
  }

  CalculatorStore.prototype.handleResetState = function handleResetState() {
    this.value = '';
    this.operation = null;
    this.firstArgument = null;
    this.errState = 0;
  };

  CalculatorStore.prototype.handleEraseDigit = function handleEraseDigit() {
    if (this.errState > 0) {
      return;
    }
    this.value = this.value.slice(0, -1);
  };

  CalculatorStore.prototype.handleInputNumberElement = function handleInputNumberElement(element) {
    if (this.errState > 0) {
      return;
    }
    if (element == "\xB7") {
      if (this.value == '') {
        this.value = '0.';
      } else if (this.value.indexOf('.') == -1) {
        this.value += '.';
      }
    } else {
      if (this.value == null) {
        this.value = element;
      } else {
        if ((this.value + element).replace(/[^0-9]/g, "").length <= this.maxDigits) {
          this.value += element;
        }
      }
    }
  };

  CalculatorStore.prototype.handleSetOperation = function handleSetOperation(operation) {
    if (this.errState > 0) {
      return;
    }
    if (this.firstArgument != null || this.value != '') {
      if (operation == '√') {
        if (this.value == '') {
          this.value = this.firstArgument;
          this.firstArgument = null;
        }
        this.value = this.processResult(Math.sqrt(parseFloat(this.value)));
        return;
      } else if (operation == '\xB1') {
        if (this.value == '') {
          this.value = this.firstArgument;
          this.firstArgument = null;
        }
        if (this.value[0] == '-') {
          this.value = this.value.substring(1);
        } else {
          this.value = '-' + this.value;
        }
        return;
      } else if (this.firstArgument == null) {
        this.firstArgument = this.value;
        this.value = '';
      } else if (this.value != '') {
        this.handleCalculateResult();
      }
      this.operation = operation;
    }
  };

  CalculatorStore.prototype.handleCalculateResult = function handleCalculateResult() {
    if (this.errState > 0 || this.operation == null) {
      return;
    }
    var first = parseFloat(this.firstArgument);
    if (this.value == '') {
      this.value = this.firstArgument;
    }
    var second = parseFloat(this.value);
    var result;
    switch (this.operation) {
      case '\xD7':
        result = first * second;
        break;
      case '+':
        result = first + second;
        break;
      case '-':
        result = first - second;
        break;
      case '\xF7':
        result = first / second;
        break;
    }
    this.operation = null;
    this.firstArgument = this.processResult(result);
    this.value = '';
  };

  CalculatorStore.prototype.processResult = function processResult(result) {
    var intLen = (Math.abs(result).toFixed(0) + '').length;
    if (intLen > this.maxDigits || isNaN(result) || !isFinite(result)) {
      this.errState = 1;
      return "error";
    }
    var value = result.toFixed(this.maxDigits - intLen) + '';
    if (value.indexOf('.') != -1) {
      value = value.replace(/0*$/, "");
      value = value.replace(/\.$/, "");
    }
    return value;
  };

  CalculatorStore.prototype.getValue = function getValue() {
    if (this.state.value == '' && this.state.firstArgument != null) {
      return this.state.firstArgument;
    }
    return this.state.value;
  };

  return CalculatorStore;
})();

var store = alt.createStore(CalculatorStore, 'CalculatorStore');

var CalculatorButton = React.createClass({
  displayName: 'CalculatorButton',

  render: function render() {
    var btnType = (this.props.type || "single") + "-btn";
    var btnColor = this.props.color || "dark";
    return React.createElement('input', { type: 'button',
      onClick: this.clickHandler,
      className: [btnType, btnColor].join(' '),
      value: this.props.text });
  },
  clickHandler: function clickHandler() {
    switch (this.props.text) {
      case 'C':
        actions.resetState();
        break;
      case '←':
        actions.eraseDigit();
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '00':
      case '\xB7':
        actions.inputNumberElement(this.props.text);
        break;
      case '=':
        actions.calculateResult();
        break;
      default:
        actions.setOperation(this.props.text);
    }
  }
});

var CalculatorScreen = React.createClass({
  displayName: 'CalculatorScreen',

  getInitialState: function getInitialState() {
    return store.getState();
  },
  componentDidMount: function componentDidMount() {
    store.listen(this.stateChanged);
  },
  stateChanged: function stateChanged(state) {
    this.setState(state);
  },
  displayValue: function displayValue(value) {
    if (isNaN(parseFloat(value))) {
      return value;
    } else {
      return this.formatToDisplay(value, '.', "'");
    }
  },
  render: function render() {
    return React.createElement(
      'p',
      { className: 'calculator-screen' },
      this.displayValue(store.getValue())
    );
  },
  formatToDisplay: function formatToDisplay(number, delimiter, groupSep) {
    var sign = '';
    if (number[0] == "-") {
      sign = "-";
      number = number.substring(1);
    }
    var numberParts = number.split('.');
    var intPart = numberParts[0];
    var fractPart = '';
    if (numberParts.length > 1) {
      fractPart = delimiter + numberParts[1].replace(/(\d{3})(?=\d)/g, "$1" + groupSep);
    }
    var numStartDigits = intPart.length > 3 ? intPart.length % 3 : 0;
    var displyIntegerPart = (numStartDigits ? intPart.substr(0, numStartDigits) + groupSep : "") + intPart.substr(numStartDigits).replace(/(\d{3})(?=\d)/g, "$1" + groupSep);
    return sign + displyIntegerPart + fractPart;
  }
});

var Calculator = React.createClass({
  displayName: 'Calculator',

  render: function render() {
    return React.createElement(
      'div',
      { className: 'calculator' },
      React.createElement(
        'p',
        { className: 'calculator-label' },
        'Calculator 10 digits'
      ),
      React.createElement(
        'div',
        { className: 'calculator-screen-container' },
        React.createElement(CalculatorScreen, null)
      ),
      React.createElement(
        'div',
        { className: 'calculator-buttons-container' },
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { type: 'double', color: 'orange', text: 'C' }),
          React.createElement(CalculatorButton, { text: '←' }),
          React.createElement(CalculatorButton, { text: '±' })
        ),
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { color: 'light', text: '7' }),
          React.createElement(CalculatorButton, { color: 'light', text: '4' }),
          React.createElement(CalculatorButton, { color: 'light', text: '1' }),
          React.createElement(CalculatorButton, { color: 'light', text: '0' })
        ),
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { color: 'light', text: '8' }),
          React.createElement(CalculatorButton, { color: 'light', text: '5' }),
          React.createElement(CalculatorButton, { color: 'light', text: '2' }),
          React.createElement(CalculatorButton, { color: 'light', text: '00' })
        ),
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { color: 'light', text: '9' }),
          React.createElement(CalculatorButton, { color: 'light', text: '6' }),
          React.createElement(CalculatorButton, { color: 'light', text: '3' }),
          React.createElement(CalculatorButton, { color: 'light', text: '·' })
        ),
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { text: '×' }),
          React.createElement(CalculatorButton, { text: '-' }),
          React.createElement(CalculatorButton, { type: 'double', text: '+' })
        ),
        React.createElement(
          'div',
          { className: 'button-column' },
          React.createElement(CalculatorButton, { text: '÷' }),
          React.createElement(CalculatorButton, { text: '√' }),
          React.createElement(CalculatorButton, { type: 'double', text: '=' })
        )
      )
    );
  }
});

React.render(React.createElement(Calculator, null), document.getElementById('calculator-container'));